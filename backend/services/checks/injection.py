import fitz

from models import CheckResult

_SUSPICIOUS_KEYWORDS = {"gpt", "chatgpt", "openai", "claude", "gemini", "llm", "ai-generated"}


async def check_injection(text: str, pdf_bytes: bytes | None = None, **kwargs) -> CheckResult:
    """Detecta texto oculto y metadata sospechosa en el PDF."""
    if pdf_bytes is None:
        pdf_bytes = kwargs.get("pdf_bytes")
    if pdf_bytes is None:
        return CheckResult(score=0, data={"hallazgos": []})

    hallazgos: list[dict] = []

    with fitz.open(stream=pdf_bytes, filetype="pdf") as doc:
        for field, value in (doc.metadata or {}).items():
            if value and any(kw in value.lower() for kw in _SUSPICIOUS_KEYWORDS):
                hallazgos.append({"tipo": "metadata", "campo": field, "valor": value})

        for page_num, page in enumerate(doc):
            for block in page.get_text("dict").get("blocks", []):
                for line in block.get("lines", []):
                    for span in line.get("spans", []):
                        if span.get("size", 12) < 1:
                            hallazgos.append({
                                "tipo": "texto_oculto",
                                "pagina": page_num + 1,
                                "preview": span.get("text", "")[:60],
                            })

    score = min(100, len(hallazgos) * 20)
    return CheckResult(score=score, data={"hallazgos": hallazgos[:10]})
