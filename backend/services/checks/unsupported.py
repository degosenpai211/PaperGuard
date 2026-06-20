from models import CheckResult


async def check_unsupported(text: str, **kwargs) -> CheckResult:
    """Stub del check de afirmaciones sin respaldo."""
    return CheckResult(score=0, data={"sin_respaldo": []})
