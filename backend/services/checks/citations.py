import httpx

from models import CheckResult

_CROSSREF = "https://api.crossref.org/works"


async def check_citations(text: str, refs: list[str] | None = None, **kwargs) -> CheckResult:
    """Verifica referencias contra CrossRef. Score = % no encontradas."""
    if refs is None:
        refs = kwargs.get("refs", [])
    if not refs:
        return CheckResult(score=0, data={"no_encontradas": []})

    not_found: list[str] = []
    async with httpx.AsyncClient(timeout=10) as client:
        for ref in refs[:20]:
            try:
                r = await client.get(
                    _CROSSREF,
                    params={"query.bibliographic": ref[:200], "rows": 1},
                    headers={"User-Agent": "PaperGuard/0.1 (hackathon; mailto:paperguard@example.com)"},
                )
                items = r.json().get("message", {}).get("items", [])
                if not items or items[0].get("score", 0) < 40:
                    not_found.append(ref)
            except Exception:
                not_found.append(ref)

    pct = int(len(not_found) / len(refs) * 100) if refs else 0
    return CheckResult(score=pct, data={"no_encontradas": not_found[:10]})
