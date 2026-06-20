import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Bot, ShieldAlert, BookOpen, Repeat2, AlertTriangle, ChevronDown, ChevronUp, ArrowLeft } from "lucide-react";
import ScoreGauge from "../components/ScoreGauge";
import VerdictBadge from "../components/VerdictBadge";
import type { Verdict } from "../types";

/* ─── Datos mock que tu equipo reemplazará con la respuesta real de la API ─── */
const MOCK = {
  audit_id: "demo-abc123",
  score_global: 71,
  veredicto: "Revisión manual" as Verdict,
  reporte_investigador: {
    resumen: "El paper presenta señales de riesgo en citas y posible contenido IA en la introducción y conclusiones. Se recomienda revisión humana antes de aceptar.",
    nivel_riesgo: "medio",
  },
  checks: [
    {
      id: "ai_detector",
      label: "Detector de contenido IA",
      icon: <Bot className="w-4 h-4" />,
      score: 72,
      peso: "30%",
      resumen: "28% del texto presenta rasgos de generación por IA, especialmente en introducción y conclusiones.",
      hallazgos: [
        "Introducción (p.2): estilo homogéneo, frases prototípicas de LLM.",
        "Conclusiones (p.9): vocabulario genérico sin especificidad técnica.",
        "Metodología §3: estructura repetitiva característica de texto generado.",
      ],
    },
    {
      id: "injection",
      label: "Inyección de prompts",
      icon: <ShieldAlert className="w-4 h-4" />,
      score: 95,
      peso: "10%",
      resumen: "Sin indicios de texto oculto, capas OCG sospechosas ni metadata alterada.",
      hallazgos: [
        "Texto visible: sin anomalías detectadas.",
        "Metadata: autor y fechas coherentes entre sí.",
        "Sin capas OCG ocultas en el documento.",
      ],
    },
    {
      id: "citations",
      label: "Exactitud de citas",
      icon: <BookOpen className="w-4 h-4" />,
      score: 58,
      peso: "25%",
      resumen: "Solo el 58% de las referencias fue verificada en CrossRef / Semantic Scholar.",
      hallazgos: [
        "[Ref 3] García et al. 2021 — no encontrada en ninguna base de datos.",
        "[Ref 7] DOI inválido: responde 404 en CrossRef.",
        "[Ref 11] Año incorrecto: publicación original es 2019, no 2022.",
        "[Ref 15] Título con discrepancias respecto al original publicado.",
      ],
    },
    {
      id: "patterns",
      label: "Patrones repetitivos",
      icon: <Repeat2 className="w-4 h-4" />,
      score: 83,
      peso: "20%",
      resumen: "Nivel de repetición dentro de rangos normales para papers académicos.",
      hallazgos: [
        "Frase 'en el contexto de' aparece 6 veces — aceptable.",
        "Sin párrafos duplicados detectados.",
        "Similitud coseno inter-secciones: 0.18 (bajo).",
      ],
    },
    {
      id: "unsupported",
      label: "Afirmaciones sin respaldo",
      icon: <AlertTriangle className="w-4 h-4" />,
      score: 65,
      peso: "15%",
      resumen: "4 afirmaciones factuales relevantes no tienen cita de respaldo cercana.",
      hallazgos: [
        "p.3: 'El 80% de los sistemas fallan en condiciones adversas' — sin cita.",
        "p.5: 'Esta técnica es ampliamente aceptada en la comunidad' — sin cita.",
        "p.6: 'Los modelos transformer superan en precisión a los anteriores' — sin cita.",
        "p.8: 'Estudios recientes demuestran que…' — sin referencia concreta.",
      ],
    },
  ],
  secciones: [
    { nombre: "Abstract",      score_ia: 45, score_confianza: 80 },
    { nombre: "Introducción",  score_ia: 82, score_confianza: 62 },
    { nombre: "Metodología",   score_ia: 55, score_confianza: 75 },
    { nombre: "Resultados",    score_ia: 38, score_confianza: 88 },
    { nombre: "Conclusión",    score_ia: 78, score_confianza: 58 },
  ],
};

type Tab = "investigador" | "revisor";

export default function ReportPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("investigador");
  const [openCheck, setOpenCheck] = useState<string | null>(null);

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Nuevo análisis
          </button>
          <p className="text-xs font-mono text-gray-400">Reporte #{id}</p>
          <h1 className="text-2xl font-bold text-gray-900 mt-0.5">Resultado de auditoría</h1>
          <p className="text-sm text-gray-400 mt-0.5">Análisis completado · 3m 42s</p>
        </div>
      </div>

      {/* Score + Veredicto */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-100 rounded-2xl p-6 flex items-center justify-center shadow-sm">
          <ScoreGauge score={MOCK.score_global} />
        </div>
        <VerdictBadge verdict={MOCK.veredicto} />
      </div>

      {/* Secciones por score IA */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Score IA por sección</h2>
        <div className="space-y-3">
          {MOCK.secciones.map((s) => {
            const color = s.score_ia >= 70 ? "bg-red-400" : s.score_ia >= 45 ? "bg-amber-400" : "bg-green-400";
            const dot = s.score_ia >= 70 ? "🔴" : s.score_ia >= 45 ? "🟡" : "🟢";
            return (
              <div key={s.nombre} className="flex items-center gap-3">
                <span className="text-xs w-28 text-gray-600 flex-shrink-0">{dot} {s.nombre}</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${s.score_ia}%` }} />
                </div>
                <span className="text-xs font-semibold text-gray-700 w-8 text-right">{s.score_ia}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabs */}
      <div>
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit mb-5">
          {(["investigador", "revisor"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-colors capitalize
                ${tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-700"}`}
            >
              Vista {t}
            </button>
          ))}
        </div>

        {/* Vista investigador */}
        {tab === "investigador" && (
          <div className="space-y-3">
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <p className="text-sm text-gray-700 leading-relaxed">{MOCK.reporte_investigador.resumen}</p>
            </div>
            {MOCK.checks.map((c) => {
              const sev = c.score >= 80 ? { badge: "bg-green-100 text-green-700", label: "OK" }
                : c.score >= 60 ? { badge: "bg-amber-100 text-amber-700", label: "Atención" }
                : { badge: "bg-red-100 text-red-700", label: "Crítico" };
              return (
                <div key={c.id} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-4 shadow-sm">
                  <div className="w-9 h-9 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-500 flex-shrink-0">
                    {c.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-semibold text-gray-800">{c.label}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${sev.badge}`}>{sev.label}</span>
                    </div>
                    <p className="text-xs text-gray-400 truncate">{c.resumen}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-lg font-bold text-gray-800">{c.score}</span>
                    <p className="text-xs text-gray-400">/100</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Vista revisor */}
        {tab === "revisor" && (
          <div className="space-y-2">
            <p className="text-xs text-gray-400 mb-4">
              Detalle técnico con evidencia y ubicación exacta. Pesos: IA 30% · Citas 25% · Patrones 20% · Sin respaldo 15% · Inyección 10%.
            </p>
            {MOCK.checks.map((c) => {
              const isOpen = openCheck === c.id;
              const barColor = c.score >= 80 ? "bg-green-400" : c.score >= 60 ? "bg-amber-400" : "bg-red-400";
              return (
                <div key={c.id} className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                  <button
                    onClick={() => setOpenCheck(isOpen ? null : c.id)}
                    className="w-full flex items-center gap-4 p-4 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-500 flex-shrink-0">
                      {c.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-800">{c.label}</span>
                        <span className="text-xs text-gray-400">peso {c.peso}</span>
                      </div>
                      <div className="mt-1.5 h-1.5 w-36 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full ${barColor} rounded-full`} style={{ width: `${c.score}%` }} />
                      </div>
                    </div>
                    <span className="text-sm font-bold text-gray-700 flex-shrink-0">{c.score}/100</span>
                    {isOpen
                      ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 border-t border-gray-50">
                      <p className="text-sm text-gray-600 py-3">{c.resumen}</p>
                      <ul className="space-y-1.5">
                        {c.hallazgos.map((h, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                            <span className="font-mono text-gray-300 flex-shrink-0 mt-0.5">{String(i + 1).padStart(2, "0")}</span>
                            {h}
                          </li>
                        ))}
                      </ul>
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
