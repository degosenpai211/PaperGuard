import json
import os

import anthropic

from models import CheckResult
from services.hf import hf_classify

HF_MODEL_ID = os.getenv("HF_MODEL_ID", "Hello-SimpleAI/chatgpt-detector-roberta")
_AI_LABELS = {"LABEL_1", "AI", "FAKE", "GENERATED", "MACHINE"}

_PROMPT = """Eres un revisor de integridad académica. Analiza el texto y devuelve SOLO un JSON válido:

{
  "score": <entero 0-100, probabilidad de ser generado por IA>,
  "fragmentos": [<hasta 4 fragmentos textuales sospechosos, máx 120 chars cada uno>],
  "razones": [<hasta 3 razones concretas: ej "transiciones genéricas", "falta de especificidad">]
}

Señales de IA: frases prototípicas ("en este contexto", "es importante destacar"), vocabulario \
uniformemente formal, falta de especificidad técnica, oraciones de longitud similar, coherencia \
superficial sin profundidad argumentativa, ausencia de voz autoral.

Texto a analizar:
"""


async def check_ai_detector(text: str, **kwargs) -> CheckResult:
    """Claude Sonnet primario con fragmentos; HF como fallback."""
    if not text.strip():
        return CheckResult(score=0, data={"fragmentos": [], "razones": []})

    # ponytail: primeras 4000 palabras capturan el estilo sin exceder contexto útil
    excerpt = " ".join(text.split()[:4000])

    try:
        client = anthropic.AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY", ""))
        msg = await client.messages.create(
            model="claude-sonnet-4-5-20251001",
            max_tokens=400,
            messages=[{"role": "user", "content": _PROMPT + excerpt}],
        )
        raw = msg.content[0].text.strip()
        # Claude a veces envuelve el JSON en ```json ... ```
        if raw.startswith("```"):
            raw = raw.split("```")[1].lstrip("json").strip()
        parsed = json.loads(raw)
        score = max(0, min(100, int(parsed.get("score", 0))))
        fragmentos = [str(f)[:120] for f in parsed.get("fragmentos", [])][:4]
        razones = [str(r) for r in parsed.get("razones", [])][:3]
        return CheckResult(score=score, data={"fragmentos": fragmentos, "razones": razones, "fuente": "claude"})
    except Exception as exc:
        print(f"[ai_detector] Claude error: {exc}")

    # Fallback HuggingFace
    try:
        scores = await hf_classify(HF_MODEL_ID, text)
        ai_score = next(
            (int(s["score"] * 100) for s in scores if s.get("label", "").upper() in _AI_LABELS), 0
        )
        return CheckResult(score=ai_score, data={"fragmentos": [], "razones": [], "fuente": "hf"})
    except Exception as exc2:
        print(f"[ai_detector] HF error: {exc2}")
        return CheckResult(score=0, data={"fragmentos": [], "razones": [], "error": str(exc2)})
