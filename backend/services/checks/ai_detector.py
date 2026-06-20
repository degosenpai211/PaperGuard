import json
import os
import re

import anthropic

from models import CheckResult
from services.hf import hf_classify

HF_MODEL_ID = os.getenv("HF_MODEL_ID", "Hello-SimpleAI/chatgpt-detector-roberta")
_AI_LABELS = {"LABEL_1", "AI", "FAKE", "GENERATED", "MACHINE"}

_PROMPT = """Eres un revisor de integridad académica. Analiza el siguiente texto académico \
y devuelve SOLO un objeto JSON válido, sin texto adicional:

{
  "score": <entero 0-100, probabilidad de ser generado por IA>,
  "fragmentos": [<hasta 4 fragmentos sospechosos del texto, máx 120 chars cada uno>],
  "razones": [<hasta 3 razones concretas, ej: "transiciones genéricas", "sin voz autoral">]
}

Señales claras de IA: frases prototípicas ("en este contexto", "es importante destacar", \
"cabe señalar que"), vocabulario uniformemente formal, falta de especificidad técnica, \
oraciones de longitud similar, coherencia superficial sin profundidad argumentativa, \
ausencia de voz autoral, conclusiones vagas sin aporte concreto.

Texto:
"""

# Separadores de sección comunes en papers
_SECTION_RE = re.compile(
    r"(?im)^\s*(abstract|resumen|introduction|introduccion|introducción|"
    r"methods?|metodolog[ií]a|results?|resultados|discussion|discusi[oó]n|"
    r"conclusions?|conclusiones)\s*$"
)


def _split_sections(text: str) -> dict[str, str]:
    """Divide el texto por headings de sección. Devuelve {nombre: contenido}."""
    parts: dict[str, str] = {}
    current_name = "preamble"
    current_lines: list[str] = []
    for line in text.splitlines():
        if _SECTION_RE.match(line):
            if current_lines:
                parts[current_name] = "\n".join(current_lines).strip()
            current_name = line.strip().lower()
            current_lines = []
        else:
            current_lines.append(line)
    if current_lines:
        parts[current_name] = "\n".join(current_lines).strip()
    return {k: v for k, v in parts.items() if len(v.split()) >= 30}


async def _score_one(client: anthropic.AsyncAnthropic, text: str) -> dict:
    """Llama a Claude y devuelve el dict parseado, o raise."""
    excerpt = " ".join(text.split()[:2000])
    msg = await client.messages.create(
        model="claude-sonnet-4-5-20251001",
        max_tokens=400,
        messages=[{"role": "user", "content": _PROMPT + excerpt}],
    )
    raw = msg.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1].lstrip("json").strip()
    return json.loads(raw)


async def check_ai_detector(text: str, **kwargs) -> CheckResult:
    """
    Analiza el texto por sección cuando hay headings detectables.
    Score global = promedio ponderado por longitud de sección.
    Fallback HuggingFace si Claude falla.
    """
    if not text.strip():
        return CheckResult(score=0, data={"fragmentos": [], "razones": [], "por_seccion": {}})

    sections = _split_sections(text)
    # Si no hay secciones claras, analizar el texto completo
    if not sections:
        sections = {"completo": text}

    try:
        client = anthropic.AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY", ""))

        import asyncio
        tasks = {name: _score_one(client, content) for name, content in sections.items()}
        results = {}
        # Ejecutar en paralelo
        names = list(tasks.keys())
        responses = await asyncio.gather(*tasks.values(), return_exceptions=True)

        por_seccion: dict[str, dict] = {}
        total_words = 0
        weighted_score = 0

        for name, resp in zip(names, responses):
            if isinstance(resp, Exception):
                print(f"[ai_detector] sección '{name}': {resp}")
                continue
            s = max(0, min(100, int(resp.get("score", 0))))
            w = len(sections[name].split())
            por_seccion[name] = {
                "score": s,
                "fragmentos": [str(f)[:120] for f in resp.get("fragmentos", [])][:4],
                "razones": [str(r) for r in resp.get("razones", [])][:3],
            }
            weighted_score += s * w
            total_words += w

        if not por_seccion:
            raise ValueError("no sections scored")

        global_score = max(0, min(100, int(weighted_score / total_words))) if total_words else 0

        # Fragmentos y razones del score más alto (sección más sospechosa)
        worst = max(por_seccion.values(), key=lambda x: x["score"])

        return CheckResult(
            score=global_score,
            data={
                "fragmentos": worst["fragmentos"],
                "razones": worst["razones"],
                "por_seccion": por_seccion,
                "fuente": "claude",
            },
        )

    except Exception as exc:
        print(f"[ai_detector] Claude error: {exc}")

    # Fallback HuggingFace (texto completo, max 512 tokens)
    try:
        hf_scores = await hf_classify(HF_MODEL_ID, text)
        ai_score = next(
            (int(s["score"] * 100) for s in hf_scores if s.get("label", "").upper() in _AI_LABELS), 0
        )
        return CheckResult(score=ai_score, data={"fragmentos": [], "razones": [], "por_seccion": {}, "fuente": "hf"})
    except Exception as exc2:
        print(f"[ai_detector] HF error: {exc2}")
        return CheckResult(score=0, data={"fragmentos": [], "razones": [], "por_seccion": {}, "error": str(exc2)})
