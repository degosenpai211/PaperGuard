import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from models import CheckResult

_MIN_WORDS = 20
_SIM_THRESHOLD = 0.7


async def check_patterns(text: str, **kwargs) -> CheckResult:
    """Detecta fragmentos repetitivos via TF-IDF + coseno."""
    paragraphs = [p.strip() for p in text.split("\n\n") if len(p.strip().split()) >= _MIN_WORDS]
    if len(paragraphs) < 2:
        return CheckResult(score=0, data={"repetidos": []})

    try:
        matrix = TfidfVectorizer(ngram_range=(2, 3)).fit_transform(paragraphs)
    except Exception:
        return CheckResult(score=0, data={"repetidos": []})

    sim = cosine_similarity(matrix)
    np.fill_diagonal(sim, 0)

    repetidos = []
    seen: set[tuple[int, int]] = set()
    for i, j in zip(*np.where(sim > _SIM_THRESHOLD)):
        if i < j and (int(i), int(j)) not in seen:
            seen.add((int(i), int(j)))
            repetidos.append({"par": [int(i), int(j)], "similitud": round(float(sim[i, j]), 2)})

    score = min(100, len(repetidos) * 10)
    return CheckResult(score=score, data={"repetidos": repetidos[:10]})
