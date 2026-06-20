from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers.audit import router as audit_router


app = FastAPI(title="PaperGuard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://paperguard.vercel.app", "http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(audit_router)


@app.get("/")
async def health() -> dict[str, str]:
    return {"status": "ok"}
