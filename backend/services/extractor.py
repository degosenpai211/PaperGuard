import io
import re

import fitz
import pdfplumber

from models import IntakeResult

SECTION_PATTERNS = {
    "abstract":     r"(?im)^\s*(abstract|resumen)\s*$",
    "introduction": r"(?im)^\s*(introduction|introduccion|introducción)\s*$",
    "methodology":  r"(?im)^\s*(methods?|metodolog[ií]a)\s*$",
    "results":      r"(?im)^\s*(results?|resultados)\s*$",
    "discussion":   r"(?im)^\s*(discussion|discusi[oó]n)\s*$",
    "conclusion":   r"(?im)^\s*(conclusions?|conclusiones)\s*$",
    "references":   r"(?im)^\s*(references|referencias|bibliograf[ií]a)\s*$",
}

# Una referencia real empieza con: [1], (1), 1., número, o apellido + año
_REF_LINE = re.compile(
    r"^\s*(\[\d+\]|\(\d+\)|\d+[\.\)]|[A-ZÁÉÍÓÚÑ][a-záéíóúñ])",
)


def _extract_references(text: str) -> list[str]:
    """Extrae solo líneas que parecen referencias bibliográficas reales."""
    match = re.search(
        r"(?is)(references|referencias|bibliograf[ií]a)\s*\n(.+)$", text
    )
    if not match:
        return []
    refs_block = match.group(2)
    lines = []
    current = ""
    for line in refs_block.splitlines():
        stripped = line.strip()
        if not stripped:
            if current:
                lines.append(current.strip())
                current = ""
            continue
        if _REF_LINE.match(stripped):
            if current:
                lines.append(current.strip())
            current = stripped
        elif current:
            # continuación de la referencia anterior (línea sangrada)
            current += " " + stripped
        # línea suelta sin referencia activa → ignorar (números de página, etc.)
    if current:
        lines.append(current.strip())
    # Filtro final: descartar líneas muy cortas o que son solo números
    return [r for r in lines if len(r.split()) >= 4][:30]


def extract_text_and_intake(pdf_bytes: bytes) -> tuple[str, IntakeResult]:
    text_parts: list[str] = []
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        for page in pdf.pages:
            text_parts.append(page.extract_text() or "")
    full_text = "\n".join(text_parts).strip()

    secciones_detectadas = [
        name for name, pattern in SECTION_PATTERNS.items()
        if re.search(pattern, full_text)
    ]

    referencias_raw = _extract_references(full_text)

    texto_oculto_encontrado = False
    with fitz.open(stream=pdf_bytes, filetype="pdf") as doc:
        for page in doc:
            for block in page.get_text("dict").get("blocks", []):
                for line in block.get("lines", []):
                    for span in line.get("spans", []):
                        if span.get("size", 12) < 1:
                            texto_oculto_encontrado = True
                            break

    return full_text, IntakeResult(
        ready_for_audit=True,
        secciones_detectadas=secciones_detectadas,
        texto_oculto_encontrado=texto_oculto_encontrado,
        referencias_raw=referencias_raw,
    )
