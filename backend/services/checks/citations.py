import httpx

from models import CheckResult

_CROSSREF = "https://api.crossref.org/works"
_S2 = "https://api.semanticscholar.org/graph/v1/paper/search"


async def _verified_by_crossref(client: httpx.AsyncClient, ref: str) -> bool:
    try:
        r = await client.get(
            _CROSSREF,
            params={"query.bibliographic": ref[:200], "rows": 1},
            headers={"User-Agent": "PaperGuard/0.1 (hackathon; mailto:paperguard@example.com)"},
        )
        items = r.json().get("message", {}).get("items", [])
        return bool(items and items[0].get("score", 0) >= 40)
    except Exception:
        return False


async def _verified_by_s2(client: httpx.AsyncClient, ref: str) -> bool:
    try:
        r = await client.get(
            _S2,
            params={"query": ref[:150], "fields": "title", "limit": 1},
            headers={"User-Agent": "PaperGuard/0.1"},
        )
        return bool(r.json().get("data"))
    except Exception:
        return False


async def check_citations(text: str, refs: list[str] | None = None, **kwargs) -> CheckResult:
    """Verifica referencias contra CrossRef; fallback a Semantic Scholar. Score = % no encontradas."""
    if refs is None:
        refs = kwargs.get("refs", [])
    if not refs:
        return CheckResult(score=0, data={"no_encontradas": []})

    not_found: list[str] = []
    async with httpx.AsyncClient(timeout=10) as client:
        for ref in refs[:20]:
            found = await _verified_by_crossref(client, ref)
            if not found:
                found = await _verified_by_s2(client, ref)
            if not found:
                not_found.append(ref)

    pct = int(len(not_found) / len(refs) * 100) if refs else 0
    return CheckResult(score=pct, data={"no_encontradas": not_found[:10]})
