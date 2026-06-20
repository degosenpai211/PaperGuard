import os

from models import CheckResult
from services.hf import hf_classify

# ponytail: cuando el fine-tuned esté en HF, solo cambia HF_MODEL_ID en .env
HF_MODEL_ID = os.getenv("HF_MODEL_ID", "Hello-SimpleAI/chatgpt-detector-roberta")

# LABEL_0=Human, LABEL_1=ChatGPT para el modelo por defecto.
# Si el nuevo modelo usa etiquetas distintas, agrégarlas aquí.
_AI_LABELS = {"LABEL_1", "AI", "FAKE", "GENERATED", "MACHINE"}


async def check_ai_detector(text: str, **kwargs) -> CheckResult:
    """Detecta patrones de IA via HuggingFace Inference API."""
    if not text.strip():
        return CheckResult(score=0, data={"fragmentos": []})

    try:
        scores = await hf_classify(HF_MODEL_ID, text)
    except Exception as exc:
        print(f"[ai_detector] HF error: {exc}")
        return CheckResult(score=0, data={"fragmentos": [], "error": str(exc)})

    ai_score = next(
        (int(s["score"] * 100) for s in scores if s.get("label", "").upper() in _AI_LABELS),
        0,
    )
    return CheckResult(score=ai_score, data={"fragmentos": [], "raw_scores": scores})
