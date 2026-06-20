import asyncio
from uuid import uuid4

import fitz
from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import JSONResponse

from services.checks.ai_detector import check_ai_detector
from services.checks.citations import check_citations
from services.checks.injection import check_injection
from services.checks.patterns import check_patterns
from services.checks.unsupported import check_unsupported
from services.extractor import extract_text_and_intake
from services.reporter import consolidate

router = APIRouter(prefix="/api")
MAX_BYTES = 20 * 1024 * 1024

# ponytail: dict en memoria; sin persistencia por diseño (PROYECTO.md §Seguridad)
_store: dict[str, dict] = {}


@router.post("/audit")
async def create_audit(file: UploadFile = File(...)):
    if file.content_type != "application/pdf":
        return JSONResponse(status_code=400, content={"error": "archivo no es PDF"})

    pdf_bytes = await file.read()
    if len(pdf_bytes) > MAX_BYTES:
        return JSONResponse(status_code=400, content={"error": "archivo supera 20MB"})

    try:
        with fitz.open(stream=pdf_bytes, filetype="pdf") as doc:
            if doc.is_encrypted:
                return JSONResponse(status_code=400, content={"error": "PDF encriptado"})
    except Exception:
        return JSONResponse(status_code=400, content={"error": "PDF inválido"})

    text, intake = extract_text_and_intake(pdf_bytes)
    if len(text.split()) <= 500:
        return JSONResponse(
            status_code=400,
            content={"error": "texto extraíble insuficiente (<500 palabras)"},
        )

    ai, inj, cit, pat, uns = await asyncio.gather(
        check_ai_detector(text),
        check_injection(text, pdf_bytes=pdf_bytes),
        check_citations(text, refs=intake.referencias_raw),
        check_patterns(text),
        check_unsupported(text),
    )

    audit_id = str(uuid4())
    result = consolidate(audit_id, intake, ai, inj, cit, pat, uns)
    _store[audit_id] = result.model_dump()
    return {"audit_id": audit_id, "status": "completed"}


@router.get("/audit/{audit_id}/status")
async def get_status(audit_id: str):
    if audit_id in _store:
        return {"status": "completed", "progress": 100}
    return {"status": "pending", "progress": 0}


@router.get("/audit/{audit_id}/result")
async def get_result(audit_id: str):
    if audit_id not in _store:
        raise HTTPException(status_code=404, detail={"error": "audit no encontrado"})
    return _store[audit_id]
