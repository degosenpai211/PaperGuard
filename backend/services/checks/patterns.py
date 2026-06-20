import re

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from models import CheckResult

_MIN_WORDS = 20
# ponytail: 0.55 captura parafraseo; 0.7 solo atrapa copias exactas
_SIM_THRESHOLD = 0.55

# Divide en oraciones solo en punto+espacio+mayúscula — ignora abreviaturas
_SENT_SPLIT = re.compile(r"(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÑ\"])")


def _sentence_uniformity(text: str) -> int:
    """
    CV bajo de longitud de oraciones = señal de IA (estilo uniforme).
    Usa split por regex para no romper en 'et al.', 'Fig.', '0.95', etc.
    """
    sentences = [s.strip() for s in _SENT_SPLIT.split(text) if len(s.split()) >= 5]
    if len(sentences) < 10:
        return 0
    lengths = [len(s.split()) for s in sentences]
    mean = float(np.mean(lengths))
    std = float(np.std(lengths))
    cv = std / mean if mean > 0 else 1.0
    # CV < 0.4 → uniformidad sospechosa; escala lineal hasta 60 puntos
    return max(0, int((0.4 - cv) / 0.4 * 60)) if cv < 0.4 else 0


async def check_patterns(text: str, **kwargs) -> CheckResult:
    """Detecta repetición (TF-IDF coseno) + uniformidad estilística."""
    paragraphs = [p.strip() for p in text.split("\n\n") if len(p.strip().split()) >= _MIN_WORDS]

    repetidos = []
    if len(paragraphs) >= 2:
        try:
            matrix = TfidfVectorizer(ngram_range=(2, 3)).fit_transform(paragraphs)
            sim = cosine_similarity(matrix)
            np.fill_diagonal(sim, 0)
            seen: set[tuple[int, int]] = set()
            for i, j in zip(*np.where(sim > _SIM_THRESHOLD)):
                if i < j and (int(i), int(j)) not in seen:
                    seen.add((int(i), int(j)))
                    repetidos.append({
                        "par": [int(i), int(j)],
                        "similitud": round(float(sim[i, j]), 2),
                        "preview_a": paragraphs[i][:80],
                        "preview_b": paragraphs[j][:80],
                    })
        except Exception:
            pass

    uniformity = _sentence_uniformity(text)
    score = min(100, min(70, len(repetidos) * 10) + uniformity)

    return CheckResult(score=score, data={
        "repetidos": repetidos[:10],
        "uniformidad_score": uniformity,
    })
