export type Verdict = "Aprobado" | "Revisión manual" | "Rechazado";
export type Severity = "ok" | "warning" | "error";

export interface CheckResult {
  score: number;
  fragmentos?: string[];
  hallazgos?: string[];
  no_encontradas?: string[];
  repetidos?: string[];
  sin_respaldo?: string[];
}

export interface SeccionResult {
  score_ia: number;
  score_confianza: number;
  alertas: string[];
  fragmentos_sospechosos: string[];
}

export interface AuditResult {
  audit_id: string;
  idioma: string;
  ready_for_audit: boolean;
  secciones: Record<string, SeccionResult>;
  checks: {
    ai_detector: CheckResult;
    injection: CheckResult;
    citations: CheckResult;
    patterns: CheckResult;
    unsupported: CheckResult;
  };
  score_global: number;
  veredicto: Verdict;
  reporte_investigador: { resumen: string; nivel_riesgo: string };
  reporte_revisor: { detalle_por_check: Record<string, unknown>; recomendacion: string };
}
