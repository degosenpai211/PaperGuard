import base64
import re
import unicodedata

import fitz

from models import CheckResult

# — Metadata keywords de generación IA
_META_KEYWORDS = {
    "gpt", "chatgpt", "openai", "claude", "gemini", "llm",
    "ai-generated", "copilot", "bard", "mistral", "deepseek",
}

# — Unicode invisible / de control que no debería estar en un paper académico
_SUSPICIOUS_UNICODE = {
    "​",  # zero-width space
    "‌",  # zero-width non-joiner
    "‍",  # zero-width joiner
    "‮",  # right-to-left override (voltea texto)
    "‪",  # left-to-right embedding
    "‫",  # right-to-left embedding
    "⁠",  # word joiner
    "﻿",  # BOM / zero-width no-break space
    "­",  # soft hyphen (invisible en render)
}

# — Prompt injection directa (comandos explícitos)
_DIRECT_INJECTION = [
    re.compile(r"ignore\s+(all\s+)?(previous|prior|above)\s+instructions?", re.I),
    re.compile(r"disregard\s+(all\s+)?(previous|prior)\s+instructions?", re.I),
    re.compile(r"you\s+are\s+now\s+(?:a\s+|an\s+)?\w+\s*(?:assistant|model|ai|reviewer)", re.I),
    re.compile(r"act\s+as\s+(?:a\s+|an\s+)?\w+\s*(?:assistant|model|ai|reviewer)", re.I),
    re.compile(r"new\s+instructions?\s*:", re.I),
    re.compile(r"system\s*prompt\s*:", re.I),
    re.compile(r"<\s*/?(?:system|prompt|instruction|override|jailbreak)\s*>", re.I),
    re.compile(r"###\s*(?:instruction|system|override|jailbreak)", re.I),
    re.compile(r"\[INST\]|\[\/INST\]|<\|im_start\|>|<\|im_end\|>"),  # tokens de modelos
]

# — Manipulación semántica del revisor (más sutil — intenta influir sin comando explícito)
_SEMANTIC_MANIPULATION = [
    # Autoridad falsa
    re.compile(r"(?:pre[- ]?approved|already\s+approved|previously\s+accepted)\s+by", re.I),
    re.compile(r"score[:\s]+(?:100|10\/10|A\+|excellent)", re.I),
    re.compile(r"all\s+references?\s+(?:have\s+been\s+|are\s+)?(?:independently\s+)?verified", re.I),
    re.compile(r"this\s+paper\s+(?:has\s+been\s+|was\s+)?(?:peer[- ]?reviewed|validated)\s+by", re.I),
    # Instrucción disfrazada de agradecimiento o nota
    re.compile(r"(?:reviewer|editor)\s+should\s+(?:note|consider|mark|rate|score)", re.I),
    re.compile(r"please\s+(?:mark|rate|score|evaluate|approve)\s+this\s+(?:paper|manuscript|work)", re.I),
    re.compile(r"(?:assign|give|award)\s+(?:a\s+)?(?:high|maximum|perfect|passing)\s+(?:score|grade|rating)", re.I),
    # Variantes en español
    re.compile(r"(?:pre[- ]?aprobado|ya\s+aprobado|previamente\s+aceptado)\s+por", re.I),
    re.compile(r"todas?\s+las?\s+referencias?\s+(?:han\s+sido\s+|están\s+)?verificadas?", re.I),
    re.compile(r"el?\s+revisor\s+deb(?:e|ería)\s+(?:notar|considerar|marcar|calificar)", re.I),
    re.compile(r"(?:asigna|da|otorga)\s+(?:un\s+)?(?:puntaje|score|calificación)\s+(?:alto|máximo|aprobatorio)", re.I),
    re.compile(r"evalúa\s+este\s+(?:paper|artículo|trabajo)\s+como\s+(?:excelente|aprobado|correcto)", re.I),
    re.compile(r"marca\s+(?:todas?\s+las?\s+)?referencias?\s+como\s+v[aá]lidas?", re.I),
]


def _is_hidden_color(color: int | None) -> bool:
    if color is None:
        return False
    return color in (16777215, 0xFFFFFF)  # blanco; fitz codifica como int RGB


def _out_of_viewport(bbox: tuple, page_rect: fitz.Rect) -> bool:
    x0, y0, x1, y1 = bbox
    return x1 < 0 or y1 < 0 or x0 > page_rect.width or y0 > page_rect.height


def _has_invisible_unicode(text: str) -> list[str]:
    found = []
    for ch in _SUSPICIOUS_UNICODE:
        if ch in text:
            name = unicodedata.name(ch, f"U+{ord(ch):04X}")
            found.append(name)
    return found


def _decode_base64_fragments(text: str) -> list[str]:
    """Busca strings Base64 largos (≥20 chars) y los decodifica para ver si contienen instrucciones."""
    suspicious = []
    for match in re.finditer(r"[A-Za-z0-9+/]{20,}={0,2}", text):
        candidate = match.group()
        try:
            decoded = base64.b64decode(candidate + "==").decode("utf-8", errors="ignore")
            # Solo reportar si el decodificado parece texto con instrucciones
            if any(kw in decoded.lower() for kw in ("ignore", "instruction", "prompt", "approve", "score", "reviewer")):
                suspicious.append(decoded[:80])
        except Exception:
            pass
    return suspicious


def _ref_flood(refs: list[str], word_count: int) -> bool:
    """
    Flood de referencias: ratio >1 referencia cada 50 palabras es sospechoso.
    Un paper de 5000 palabras con 200 refs está inflando para diluir % no-verificadas.
    """
    if not refs or word_count < 500:
        return False
    return len(refs) / (word_count / 50) > 2.0


async def check_injection(
    text: str,
    pdf_bytes: bytes | None = None,
    refs: list[str] | None = None,
    **kwargs,
) -> CheckResult:
    """
    Detecta 9 vectores de ataque para manipular un revisor basado en IA:
    1. texto font_size < 1
    2. texto color blanco sobre blanco
    3. texto fuera del viewport
    4. anotaciones/comentarios PDF
    5. metadata con keywords de LLMs
    6. unicode invisible (zero-width, RTL override, BOM, soft hyphen)
    7. instrucciones codificadas en Base64
    8. prompt injection directa (comandos explícitos EN+ES)
    9. manipulación semántica del revisor (autoridad falsa, instrucciones disfrazadas)
    + flood de referencias (señal estructural)
    """
    if pdf_bytes is None:
        pdf_bytes = kwargs.get("pdf_bytes", b"")
    if refs is None:
        refs = kwargs.get("refs", [])

    hallazgos: list[dict] = []

    if pdf_bytes:
        with fitz.open(stream=pdf_bytes, filetype="pdf") as doc:
            # — 5. Metadata
            for field, value in (doc.metadata or {}).items():
                if value and any(kw in value.lower() for kw in _META_KEYWORDS):
                    hallazgos.append({"tipo": "metadata_sospechosa", "campo": field, "preview": value[:100]})

            for page_num, page in enumerate(doc):
                page_rect = page.rect

                for block in page.get_text("dict").get("blocks", []):
                    for line in block.get("lines", []):
                        for span in line.get("spans", []):
                            content = span.get("text", "").strip()
                            if not content:
                                continue
                            size = span.get("size", 12)
                            color = span.get("color")
                            bbox = span.get("bbox", (0, 0, 0, 0))

                            if size < 1:  # — 1
                                hallazgos.append({"tipo": "texto_invisible_tamaño", "pagina": page_num + 1, "preview": content[:80]})
                            elif _is_hidden_color(color):  # — 2
                                hallazgos.append({"tipo": "texto_invisible_color", "pagina": page_num + 1, "preview": content[:80]})
                            elif _out_of_viewport(bbox, page_rect):  # — 3
                                hallazgos.append({"tipo": "texto_fuera_viewport", "pagina": page_num + 1, "preview": content[:80]})

                # — 4. Anotaciones
                for annot in page.annots():
                    content = annot.info.get("content", "").strip()
                    if content:
                        hallazgos.append({"tipo": "anotacion_embebida", "pagina": page_num + 1, "preview": content[:80]})

    # — 6. Unicode invisible
    invisible = _has_invisible_unicode(text)
    for name in invisible:
        hallazgos.append({"tipo": "unicode_invisible", "preview": name})

    # — 7. Base64 con instrucciones
    for decoded in _decode_base64_fragments(text):
        hallazgos.append({"tipo": "instruccion_codificada_base64", "preview": decoded})

    # — 8. Prompt injection directa
    for pattern in _DIRECT_INJECTION:
        m = pattern.search(text)
        if m:
            start = max(0, m.start() - 20)
            hallazgos.append({"tipo": "prompt_injection_directa", "preview": text[start: m.end() + 20][:120]})

    # — 9. Manipulación semántica
    for pattern in _SEMANTIC_MANIPULATION:
        m = pattern.search(text)
        if m:
            start = max(0, m.start() - 20)
            hallazgos.append({"tipo": "manipulacion_semantica", "preview": text[start: m.end() + 20][:120]})

    # — Flood de referencias
    word_count = len(text.split())
    if _ref_flood(refs, word_count):
        hallazgos.append({
            "tipo": "flood_referencias",
            "preview": f"{len(refs)} referencias para {word_count} palabras — ratio sospechoso",
        })

    # Deduplicar
    seen: set[str] = set()
    unique = [h for h in hallazgos if (k := h.get("preview", "")) not in seen and not seen.add(k)]  # type: ignore[func-returns-value]

    score = min(100, len(unique) * 20)
    return CheckResult(score=score, data={"hallazgos": unique[:20]})
