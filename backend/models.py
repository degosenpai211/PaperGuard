from typing import Any

from pydantic import BaseModel, Field


class Section(BaseModel):
    score_ia: int = 0
    score_confianza: int = 0
    alertas: list[str] = Field(default_factory=list)
    fragmentos_sospechosos: list[str] = Field(default_factory=list)


class CheckResult(BaseModel):
    score: int = 0
    data: dict[str, Any] = Field(default_factory=dict)


class IntakeResult(BaseModel):
    ready_for_audit: bool
    secciones_detectadas: list[str] = Field(default_factory=list)
    texto_oculto_encontrado: bool = False
    referencias_raw: list[str] = Field(default_factory=list)


class ReporteInvestigador(BaseModel):
    resumen: str = ""
    nivel_riesgo: str = "bajo"


class ReporteRevisor(BaseModel):
    detalle_por_check: dict[str, Any] = Field(default_factory=dict)
    recomendacion: str = ""


class AuditResult(BaseModel):
    audit_id: str
    idioma: str = "es"
    ready_for_audit: bool = True
    secciones: dict[str, Section] = Field(default_factory=dict)
    checks: dict[str, CheckResult] = Field(default_factory=dict)
    score_global: int = 0
    veredicto: str = "Revisión manual"
    reporte_investigador: ReporteInvestigador = Field(default_factory=ReporteInvestigador)
    reporte_revisor: ReporteRevisor = Field(default_factory=ReporteRevisor)
