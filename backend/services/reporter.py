from models import AuditResult, CheckResult, IntakeResult, ReporteInvestigador, ReporteRevisor, Section

_WEIGHTS = {"ai": 0.30, "citations": 0.25, "patterns": 0.20, "unsupported": 0.15, "injection": 0.10}

_RIESGO = {(0, 30): "bajo", (30, 60): "medio", (60, 101): "alto"}


def _nivel_riesgo(score: int) -> str:
    for (lo, hi), nivel in _RIESGO.items():
        if lo <= score < hi:
            return nivel
    return "alto"


def consolidate(
    audit_id: str,
    intake: IntakeResult,
    ai: CheckResult,
    injection: CheckResult,
    citations: CheckResult,
    patterns: CheckResult,
    unsupported: CheckResult,
) -> AuditResult:
    score = int(
        ai.score * _WEIGHTS["ai"]
        + citations.score * _WEIGHTS["citations"]
        + patterns.score * _WEIGHTS["patterns"]
        + unsupported.score * _WEIGHTS["unsupported"]
        + injection.score * _WEIGHTS["injection"]
    )

    if score >= 50:
        veredicto = "Rechazado"
    elif score >= 20:
        veredicto = "Revisión manual"
    else:
        veredicto = "Aprobado"

    nivel = _nivel_riesgo(score)
    no_enc = citations.data.get("no_encontradas", [])
    rec_parts = []
    if ai.score >= 50:
        rec_parts.append("Revisar secciones con posible contenido generado por IA")
    if no_enc:
        rec_parts.append(f"Verificar manualmente {len(no_enc)} referencia(s) no encontrada(s)")
    if patterns.score >= 30:
        rec_parts.append("Revisar fragmentos repetitivos detectados")
    if injection.score > 0:
        rec_parts.append("Inspeccionar metadata y texto oculto del PDF")
    recomendacion = ". ".join(rec_parts) or "Sin observaciones críticas."

    return AuditResult(
        audit_id=audit_id,
        ready_for_audit=intake.ready_for_audit,
        secciones={s: Section() for s in intake.secciones_detectadas},
        checks={
            "ai_detector": ai,
            "injection": injection,
            "citations": citations,
            "patterns": patterns,
            "unsupported": unsupported,
        },
        score_global=score,
        veredicto=veredicto,
        reporte_investigador=ReporteInvestigador(
            resumen=f"Score global: {score}/100. Veredicto: {veredicto}. {recomendacion}",
            nivel_riesgo=nivel,
        ),
        reporte_revisor=ReporteRevisor(
            detalle_por_check={
                "ai_detector": {"score": ai.score, "peso": "30%"},
                "citations": {"score": citations.score, "peso": "25%", "no_encontradas": no_enc},
                "patterns": {"score": patterns.score, "peso": "20%"},
                "unsupported": {"score": unsupported.score, "peso": "15%"},
                "injection": {"score": injection.score, "peso": "10%"},
            },
            recomendacion=recomendacion,
        ),
    )
