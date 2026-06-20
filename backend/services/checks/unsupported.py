import os
import re

import anthropic

from models import CheckResult

_PROMPT = (
    "Eres un revisor académico. Del siguiente texto, identifica hasta 5 afirmaciones "
    "fácticas fuertes (hechos, estadísticas, resultados) que NO tienen una cita cercana "
    "(entre paréntesis o corchetes). Devuelve solo las afirmaciones, una por línea, "
    "sin numeración. Si no hay ninguna, responde 'NINGUNA'.\n\n"
)


async def check_unsupported(text: str, **kwargs) -> CheckResult:
    """Detecta afirmaciones sin respaldo mediante Claude."""
    if not text.strip():
        return CheckResult(score=0, data={"sin_respaldo": []})

    # ponytail: solo primeras 3000 palabras — suficiente para detectar el patrón
    excerpt = " ".join(text.split()[:3000])
    try:
        client = anthropic.AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY", ""))
        msg = await client.messages.create(
            model="claude-sonnet-4-5-20251001",
            max_tokens=300,
            messages=[{"role": "user", "content": _PROMPT + excerpt}],
        )
        raw = msg.content[0].text.strip()
        if raw.upper() == "NINGUNA" or not raw:
            return CheckResult(score=0, data={"sin_respaldo": []})
        sin_respaldo = [l.strip() for l in raw.splitlines() if l.strip()][:5]
        score = min(100, len(sin_respaldo) * 20)
        return CheckResult(score=score, data={"sin_respaldo": sin_respaldo})
    except Exception as exc:
        print(f"[unsupported] error: {exc}")
        return CheckResult(score=0, data={"sin_respaldo": [], "error": str(exc)})
