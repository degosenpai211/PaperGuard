import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Bot, ShieldAlert, BookOpen, Repeat2, AlertTriangle, ChevronDown, ChevronUp, ArrowLeft, Download, Share2 } from "lucide-react";
import ScoreGauge from "../components/ScoreGauge";
import VerdictBadge from "../components/VerdictBadge";
import type { Verdict } from "../types";
import { getAnalysis } from "../store";

type Tab = "investigador" | "revisor";

const CHECKS = [
  { id: "ai_detector", label: "Detector de contenido IA",  icon: <Bot className="w-4 h-4" />,           peso: "30%",
    resumen: "28% del texto presenta rasgos de generación por IA, especialmente en introducción y conclusiones.",
    hallazgos: ["Introducción (p.2): estilo homogéneo, frases prototípicas de LLM.", "Conclusiones (p.9): vocabulario genérico sin especificidad técnica.", "Metodología §3: estructura repetitiva característica de texto generado."] },
  { id: "injection",   label: "Inyección de prompts",      icon: <ShieldAlert className="w-4 h-4" />,    peso: "10%",
    resumen: "Sin indicios de texto oculto, capas OCG sospechosas ni metadata alterada.",
    hallazgos: ["Texto visible: sin anomalías detectadas.", "Metadata: autor y fechas coherentes entre sí.", "Sin capas OCG ocultas en el documento."] },
  { id: "citations",   label: "Exactitud de citas",        icon: <BookOpen className="w-4 h-4" />,       peso: "25%",
    resumen: "Solo el 58% de las referencias fue verificada en CrossRef / Semantic Scholar.",
    hallazgos: ["[Ref 3] García et al. 2021 — no encontrada en ninguna base de datos.", "[Ref 7] DOI inválido: responde 404 en CrossRef.", "[Ref 11] Año incorrecto: publicación original es 2019, no 2022."] },
  { id: "patterns",    label: "Patrones repetitivos",      icon: <Repeat2 className="w-4 h-4" />,        peso: "20%",
    resumen: "Nivel de repetición dentro de rangos normales para papers académicos.",
    hallazgos: ["Frase 'en el contexto de' aparece 6 veces — aceptable.", "Sin párrafos duplicados detectados.", "Similitud coseno inter-secciones: 0.18 (bajo)."] },
  { id: "unsupported", label: "Afirmaciones sin respaldo", icon: <AlertTriangle className="w-4 h-4" />,  peso: "15%",
    resumen: "4 afirmaciones factuales relevantes no tienen cita de respaldo cercana.",
    hallazgos: ["p.3: 'El 80% de los sistemas fallan en condiciones adversas' — sin cita.", "p.5: 'Esta técnica es ampliamente aceptada' — sin cita.", "p.6: 'Los modelos transformer superan en precisión a los anteriores' — sin cita."] },
];

const SECCIONES = [
  { nombre: "Abstract",     score_ia: 45 },
  { nombre: "Introducción", score_ia: 82 },
  { nombre: "Metodología",  score_ia: 55 },
  { nombre: "Resultados",   score_ia: 38 },
  { nombre: "Conclusión",   score_ia: 78 },
];

// Scores por check determinísticos basados en el score global
function getCheckScore(globalScore: number, base: number): number {
  return Math.max(30, Math.min(100, base + (globalScore - 71)));
}

export default function ReportPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("investigador");
  const [openCheck, setOpenCheck] = useState<string | null>(null);

  const stored = id ? getAnalysis(id) : undefined;
  const scoreGlobal = stored?.score ?? 71;
  const fileName = stored?.name ?? `Documento #${id}`;
  const veredicto: Verdict = scoreGlobal >= 80 ? "Aprobado" : scoreGlobal >= 60 ? "Revisión manual" : "Rechazado";

  const checkScores: Record<string, number> = {
    ai_detector: getCheckScore(scoreGlobal, 72),
    injection:   getCheckScore(scoreGlobal, 95),
    citations:   getCheckScore(scoreGlobal, 58),
    patterns:    getCheckScore(scoreGlobal, 83),
    unsupported: getCheckScore(scoreGlobal, 65),
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <button onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-on-surface mb-3 transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> Volver
          </button>
          <h1 className="text-2xl font-bold text-on-surface">Resultado de auditoría</h1>
          <div className="flex items-center gap-2 text-xs text-on-surface-variant mt-1 flex-wrap">
            <span className="font-mono bg-surface-container px-2 py-0.5 rounded">#{id}</span>
            <span>·</span>
            <span className="font-medium text-on-surface truncate max-w-xs">{fileName}</span>
            {stored && <><span>·</span><span>{stored.date} {stored.time}</span></>}
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={() => navigate("/history")}
            className="flex items-center gap-1.5 px-3 py-2 bg-surface-container border border-outline-variant rounded-lg text-sm text-on-surface hover:bg-surface-container-high transition-colors">
            <Share2 className="w-4 h-4" /> Historial
          </button>
          <button onClick={() => alert("Exportando PDF… (disponible con backend conectado)")}
            className="flex items-center gap-1.5 px-3 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:opacity-90 transition-opacity">
            <Download className="w-4 h-4" /> Exportar PDF
          </button>
        </div>
      </div>

      {/* Score + Veredicto */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex items-center justify-center">
          <ScoreGauge score={scoreGlobal} />
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6">
          <VerdictBadge verdict={veredicto} />
        </div>
      </div>

      {/* Secciones */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6">
        <h2 className="text-base font-bold text-on-surface mb-4">Análisis por sección</h2>
        <div className="space-y-3">
          {SECCIONES.map((s) => {
            const adjusted = Math.max(20, Math.min(100, s.score_ia + (scoreGlobal - 71)));
            const color = adjusted >= 70 ? "bg-error" : adjusted >= 45 ? "bg-primary-fixed-dim" : "bg-tertiary-container";
            const textColor = adjusted >= 70 ? "text-error" : adjusted >= 45 ? "text-primary" : "text-tertiary-container";
            const label = adjusted >= 70 ? "Alto riesgo" : adjusted >= 45 ? "Riesgo medio" : "Bajo riesgo";
            return (
              <div key={s.nombre} className="flex items-center gap-4 p-3 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors">
                <div className="w-28 flex-shrink-0">
                  <p className="text-sm font-semibold text-on-surface">{s.nombre}</p>
                </div>
                <div className="flex-1 h-2 bg-surface-container rounded-full overflow-hidden">
                  <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${adjusted}%` }} />
                </div>
                <span className={`text-xs font-bold w-24 text-right ${textColor}`}>{adjusted}% · {label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabs */}
      <div>
        <div className="flex gap-1.5 p-1.5 bg-surface-container rounded-xl w-fit mb-5">
          {(["investigador", "revisor"] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2 text-sm font-bold rounded-lg transition-all capitalize ${
                tab === t ? "bg-primary text-white shadow" : "text-on-surface-variant hover:text-on-surface"
              }`}>
              Vista {t}
            </button>
          ))}
        </div>

        {tab === "investigador" && (
          <div className="space-y-4">
            <div className="bg-secondary-container border border-primary/20 rounded-xl p-5">
              <p className="text-sm text-on-surface leading-relaxed font-medium">
                {scoreGlobal >= 80
                  ? `El paper "${fileName}" presenta un nivel de integridad aceptable. Se detectaron mínimas señales de riesgo. Apto para envío editorial.`
                  : scoreGlobal >= 60
                  ? `El paper "${fileName}" presenta señales de riesgo en citas y posible contenido IA. Se recomienda revisión humana antes de aceptar.`
                  : `El paper "${fileName}" presenta múltiples señales críticas de riesgo. Se recomienda revisión exhaustiva antes de cualquier envío.`}
              </p>
            </div>
            {CHECKS.map((c) => {
              const score = checkScores[c.id];
              const sev = score >= 80
                ? { badge: "bg-surface-container text-tertiary-container border border-outline-variant", label: "✅ Aprobado" }
                : score >= 60
                ? { badge: "bg-secondary-container text-primary border border-primary/20", label: "⚠️ Atención" }
                : { badge: "bg-error-container text-error border border-error/20", label: "❌ Crítico" };
              return (
                <div key={c.id} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center flex-shrink-0 text-on-surface-variant">{c.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <h3 className="text-sm font-bold text-on-surface">{c.label}</h3>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${sev.badge}`}>{sev.label}</span>
                      </div>
                      <p className="text-xs text-on-surface-variant mb-3">{c.resumen}</p>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-surface-container rounded-full overflow-hidden max-w-xs">
                          <div className={`h-full rounded-full ${score >= 80 ? "bg-tertiary-container" : score >= 60 ? "bg-primary-fixed-dim" : "bg-error"}`}
                            style={{ width: `${score}%` }} />
                        </div>
                        <span className="text-sm font-bold text-on-surface">{score}/100</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === "revisor" && (
          <div className="space-y-3">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-base">📊</span>
                <p className="text-sm font-semibold text-on-surface">Detalle técnico con evidencia y ubicación exacta</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "IA", pct: "30%" }, { label: "Citas", pct: "25%" }, { label: "Patrones", pct: "20%" },
                  { label: "Sin respaldo", pct: "15%" }, { label: "Inyección", pct: "10%" },
                ].map(({ label, pct }) => (
                  <span key={label} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/20 bg-secondary-container text-primary text-xs font-semibold">
                    {label} · <span className="font-bold">{pct}</span>
                  </span>
                ))}
              </div>
            </div>

            {CHECKS.map((c) => {
              const score = checkScores[c.id];
              const isOpen = openCheck === c.id;
              const barCls = score >= 80 ? "bg-tertiary-container" : score >= 60 ? "bg-primary-fixed-dim" : "bg-error";
              return (
                <div key={c.id} className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
                  <button onClick={() => setOpenCheck(isOpen ? null : c.id)}
                    className="w-full flex items-center gap-4 p-5 text-left hover:bg-surface-container-low transition-colors">
                    <div className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant flex-shrink-0">{c.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <h4 className="text-sm font-bold text-on-surface">{c.label}</h4>
                        <span className="text-xs text-on-surface-variant bg-surface-container px-2 py-0.5 rounded">peso {c.peso}</span>
                      </div>
                      <div className="h-1.5 w-48 bg-surface-container rounded-full overflow-hidden">
                        <div className={`h-full ${barCls} rounded-full`} style={{ width: `${score}%` }} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-lg font-bold text-on-surface">{score}</span>
                      <span className="text-xs text-on-surface-variant">/100</span>
                      {isOpen ? <ChevronUp className="w-4 h-4 text-primary" /> : <ChevronDown className="w-4 h-4 text-on-surface-variant" />}
                    </div>
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 border-t border-outline-variant pt-4 space-y-3">
                      <div className="bg-surface-container-low border border-outline-variant rounded-lg p-4">
                        <p className="text-sm text-on-surface leading-relaxed">{c.resumen}</p>
                      </div>
                      <h5 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Hallazgos</h5>
                      <div className="space-y-2">
                        {c.hallazgos.map((h, i) => (
                          <div key={i} className="flex items-start gap-3 bg-surface-container-low border border-outline-variant rounded-lg p-3 hover:border-primary/30 transition-colors">
                            <span className="font-mono text-xs font-bold text-primary bg-secondary-container px-2 py-0.5 rounded flex-shrink-0">
                              {String(i + 1).padStart(2, "0")}
                            </span>
                            <p className="text-sm text-on-surface leading-relaxed">{h}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
