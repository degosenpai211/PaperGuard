import asyncio

import httpx

from models import CheckResult

_CROSSREF = "https://api.crossref.org/works"
_S2 = "https://api.semanticscholar.org/graph/v1/paper/search"
_HEADERS_CR = {"User-Agent": "PaperGuard/0.1 (hackathon; mailto:paperguard@example.com)"}


async def _verify_one(client: httpx.AsyncClient, ref: str) -> bool:
    try:
        r = await client.get(
            _CROSSREF,
            params={"query.bibliographic": ref[:200], "rows": 1},
            headers=_HEADERS_CR,
        )
        items = r.json().get("message", {}).get("items", [])
        if items and items[0].get("score", 0) >= 40:
            return True
    except Exception:
        pass
    try:
        r = await client.get(
            _S2,
            params={"query": ref[:150], "fields": "title", "limit": 1},
        )
        return bool(r.json().get("data"))
    except Exception:
        return False


async def check_citations(text: str, refs: list[str] | None = None, **kwargs) -> CheckResult:
    """Verifica referencias en paralelo: CrossRef primario, Semantic Scholar fallback."""
    if not refs:
        refs = kwargs.get("refs", [])
    if not refs:
        return CheckResult(score=0, data={"no_encontradas": []})

    sample = refs[:20]
    async with httpx.AsyncClient(timeout=10) as client:
        results = await asyncio.gather(*[_verify_one(client, r) for r in sample], return_exceptions=True)

    not_found = [ref for ref, ok in zip(sample, results) if not ok or isinstance(ok, Exception)]
    pct = int(len(not_found) / len(sample) * 100)
    return CheckResult(score=pct, data={"no_encontradas": not_found[:10]})
