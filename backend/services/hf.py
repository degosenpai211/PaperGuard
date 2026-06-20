import os

import httpx

HF_API_KEY = os.getenv("HF_API_KEY", "")
HF_BASE = "https://api-inference.huggingface.co/models"


async def hf_classify(model_id: str, text: str) -> list[dict]:
    """Text classification via HF Inference API. Returns [{label, score}]."""
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            f"{HF_BASE}/{model_id}",
            headers={"Authorization": f"Bearer {HF_API_KEY}"},
            json={"inputs": text[:512]},
        )
        resp.raise_for_status()
        result = resp.json()
    # API retorna [[{...}]] o [{...}] según el modelo
    if isinstance(result, list) and result and isinstance(result[0], list):
        return result[0]
    if isinstance(result, list):
        return result
    return []
