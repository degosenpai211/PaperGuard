import io
import re

import fitz
import pdfplumber

from models import IntakeResult


SECTION_PATTERNS = {
    "abstract": r"(?im)^\s*(abstract|resumen)\s*$",
    "introduction": r"(?im)^\s*(introduction|introduccion|introducción)\s*$",
    "methodology": r"(?im)^\s*(methods?|metodologia|metodología)\s*$",
    "results": r"(?im)^\s*(results?|resultados)\s*$",
    "discussion": r"(?im)^\s*(discussion|discusion|discusión)\s*$",
    "conclusion": r"(?im)^\s*(conclusions?|conclusiones)\s*$",
    "references": r"(?im)^\s*(references|referencias|bibliograf[ií]a)\s*$",
}


def extract_text_and_intake(pdf_bytes: bytes) -> tuple[str, IntakeResult]:
    text_parts: list[str] = []
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        for page in pdf.pages:
            text_parts.append(page.extract_text() or "")
    full_text = "\n".join(text_parts).strip()

    secciones_detectadas = [
        name for name, pattern in SECTION_PATTERNS.items() if re.search(pattern, full_text)
    ]
    referencias_raw = []
    refs_match = re.search(
        r"(?is)(references|referencias|bibliograf[ií]a)\s*(.+)$", full_text
    )
    if refs_match:
        referencias_raw = [
            line.strip()
            for line in refs_match.group(2).splitlines()
            if line.strip()
        ]

    texto_oculto_encontrado = False
    with fitz.open(stream=pdf_bytes, filetype="pdf") as doc:
        for page in doc:
            blocks = page.get_text("dict").get("blocks", [])
            for block in blocks:
                for line in block.get("lines", []):
                    for span in line.get("spans", []):
                        if span.get("size", 12) < 1:
                            texto_oculto_encontrado = True
                            break
                    if texto_oculto_encontrado:
                        break
                if texto_oculto_encontrado:
                    break
            if texto_oculto_encontrado:
                break

    intake = IntakeResult(
        ready_for_audit=True,
        secciones_detectadas=secciones_detectadas,
        texto_oculto_encontrado=texto_oculto_encontrado,
        referencias_raw=referencias_raw,
    )
    return full_text, intake
