import re

import fitz

from models import CheckResult

# Keywords en metadata que indican generación IA
_META_KEYWORDS = {"gpt", "chatgpt", "openai", "claude", "gemini", "llm", "ai-generated", "copilot"}

# Frases de prompt injection en texto visible
_INJECTION_PATTERNS = [
    re.compile(r"ignore\s+(all\s+)?(previous|prior|above)\s+instructions?", re.I),
    re.compile(r"disregard\s+(all\s+)?(previous|prior)\s+instructions?", re.I),
    re.compile(r"you\s+are\s+now\s+(a\s+)?(?:an?\s+)?\w+\s*(assistant|model|ai)", re.I),
    re.compile(r"act\s+as\s+(a\s+)?(?:an?\s+)?\w+\s*(assistant|model|ai)", re.I),
    re.compile(r"new\s+instructions?:", re.I),
    re.compile(r"system\s*prompt\s*:", re.I),
    re.compile(r"<\s*/?(?:system|prompt|instruction|override)\s*>", re.I),
    re.compile(r"###\s*(instruction|system|override)", re.I),
    re.compile(r"evalúa\s+este\s+paper\s+como\s+(excelente|aprobado)", re.I),
    re.compile(r"marca\s+(todas?\s+las?\s+)?referencias?\s+como\s+v[aá]lidas?", re.I),
    re.compile(r"asigna\s+(un\s+)?score\s+(alto|de\s+\d+)", re.I),
]


def _is_hidden_color(color: int | None) -> bool:
    """Texto con color == fondo blanco (0xFFFFFF) o negro sobre negro (0x000000 bg)."""
    if color is None:
        return False
    # fitz codifica colores como entero RGB; blanco = 16777215
    return color in (16777215, 0xFFFFFF)


def _out_of_viewport(bbox: tuple, page_rect: fitz.Rect) -> bool:
    """Retorna True si el bbox está fuera del área visible de la página."""
    x0, y0, x1, y1 = bbox
    return x1 < 0 or y1 < 0 or x0 > page_rect.width or y0 > page_rect.height


async def check_injection(text: str, pdf_bytes: bytes | None = None, **kwargs) -> CheckResult:
    """
    Detecta vectores de prompt injection y contenido oculto:
    1. Texto con font_size < 1 (invisible por tamaño)
    2. Texto blanco sobre blanco (color == 0xFFFFFF)
    3. Texto fuera del viewport de la página
    4. Anotaciones y comentarios embebidos
    5. Metadata con keywords de generación IA
    6. Frases de prompt injection en texto visible
    """
    if pdf_bytes is None:
        pdf_bytes = kwargs.get("pdf_bytes")
    if pdf_bytes is None:
        return CheckResult(score=0, data={"hallazgos": []})

    hallazgos: list[dict] = []

    with fitz.open(stream=pdf_bytes, filetype="pdf") as doc:
        # — 1. Metadata sospechosa
        for field, value in (doc.metadata or {}).items():
            if value and any(kw in value.lower() for kw in _META_KEYWORDS):
                hallazgos.append({"tipo": "metadata", "campo": field, "valor": value[:100]})

        for page_num, page in enumerate(doc):
            page_rect = page.rect

            # — 2+3+4. Spans de texto oculto
            for block in page.get_text("dict").get("blocks", []):
                for line in block.get("lines", []):
                    for span in line.get("spans", []):
                        content = span.get("text", "").strip()
                        if not content:
                            continue
                        size = span.get("size", 12)
                        color = span.get("color")
                        bbox = span.get("bbox", (0, 0, 0, 0))

                        if size < 1:
                            hallazgos.append({
                                "tipo": "texto_invisible_tamaño",
                                "pagina": page_num + 1,
                                "preview": content[:80],
                            })
                        elif _is_hidden_color(color):
                            hallazgos.append({
                                "tipo": "texto_invisible_color",
                                "pagina": page_num + 1,
                                "preview": content[:80],
                            })
                        elif _out_of_viewport(bbox, page_rect):
                            hallazgos.append({
                                "tipo": "texto_fuera_viewport",
                                "pagina": page_num + 1,
                                "preview": content[:80],
                            })

            # — 5. Anotaciones embebidas
            for annot in page.annots():
                content = annot.info.get("content", "").strip()
                if content:
                    hallazgos.append({
                        "tipo": "anotacion",
                        "pagina": page_num + 1,
                        "preview": content[:80],
                    })

    # — 6. Prompt injection en texto visible
    for pattern in _INJECTION_PATTERNS:
        match = pattern.search(text)
        if match:
            start = max(0, match.start() - 20)
            hallazgos.append({
                "tipo": "prompt_injection_visible",
                "preview": text[start: match.end() + 20][:120],
            })

    # Deduplicar previews idénticos
    seen_previews: set[str] = set()
    unique: list[dict] = []
    for h in hallazgos:
        key = h.get("preview", "")
        if key not in seen_previews:
            seen_previews.add(key)
            unique.append(h)

    score = min(100, len(unique) * 25)
    return CheckResult(score=score, data={"hallazgos": unique[:15]})
