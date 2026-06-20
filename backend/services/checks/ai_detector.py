import os

import anthropic

from models import CheckResult
from services.hf import hf_classify

# ponytail: cuando el fine-tuned esté en HF, cambia HF_MODEL_ID en .env
HF_MODEL_ID = os.getenv("HF_MODEL_ID", "Hello-SimpleAI/chatgpt-detector-roberta")
_AI_LABELS = {"LABEL_1", "AI", "FAKE", "GENERATED", "MACHINE"}

_PROMPT = (
    "Analiza este texto académico. ¿Qué probabilidad (0-100) tiene de haber sido generado "
    "por IA? Considera: vocabulario genérico, frases prototípicas de LLM, falta de "
    "especificidad técnica, uniformidad estilística, coherencia superficial sin profundidad. "
    "Responde SOLO con un número entero entre 0 y 100.\n\n"
)


async def check_ai_detector(text: str, **kwargs) -> CheckResult:
    """Detecta patrones de IA. Claude Sonnet primario, HF Inference como fallback."""
    if not text.strip():
        return CheckResult(score=0, data={"fragmentos": []})

    # Primario: Claude Sonnet
    try:
        client = anthropic.AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY", ""))
        msg = await client.messages.create(
            model="claude-sonnet-4-5-20251001",
            max_tokens=10,
            messages=[{"role": "user", "content": _PROMPT + text[:3000]}],
        )
        raw = msg.content[0].text.strip()
        digits = "".join(c for c in raw if c.isdigit())[:3]
        score = max(0, min(100, int(digits))) if digits else 0
        return CheckResult(score=score, data={"fragmentos": [], "fuente": "claude"})
    except Exception as exc:
        print(f"[ai_detector] Claude error: {exc}")

    # Fallback: HuggingFace Inference API
    try:
        scores = await hf_classify(HF_MODEL_ID, text)
        ai_score = next(
            (int(s["score"] * 100) for s in scores if s.get("label", "").upper() in _AI_LABELS),
            0,
        )
        return CheckResult(score=ai_score, data={"fragmentos": [], "fuente": "hf", "raw_scores": scores})
    except Exception as exc2:
        print(f"[ai_detector] HF error: {exc2}")
        return CheckResult(score=0, data={"fragmentos": [], "error": str(exc2)})
