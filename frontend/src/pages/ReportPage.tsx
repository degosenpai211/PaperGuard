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
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-6 mb-8">
        <div>
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> 
            Nuevo análisis
          </button>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-gray-900">Resultado de auditoría</h1>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-mono bg-gray-100 px-3 py-1 rounded-lg">#{id}</span>
              <span>·</span>
              <span>✅ Análisis completado · 3m 42s</span>
            </div>
          </div>
        </div>
      </div>

      {/* Score + Veredicto */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center">
          <ScoreGauge score={MOCK.score_global} />
        </div>
        <div>
          <VerdictBadge verdict={MOCK.veredicto} />
        </div>
      </div>

      {/* Secciones por score IA */}
      <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-lg">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Análisis por sección</h2>
        <div className="space-y-4">
          {MOCK.secciones.map((s) => {
            const color = s.score_ia >= 70 ? "from-red-400 to-red-500" : s.score_ia >= 45 ? "from-amber-400 to-amber-500" : "from-green-400 to-emerald-500";
            const riskLabel = s.score_ia >= 70 ? "Alto riesgo IA" : s.score_ia >= 45 ? "Riesgo medio" : "Bajo riesgo";
            return (
              <div key={s.nombre} className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-150 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-gray-900">{s.nombre}</h3>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full bg-gradient-to-r ${color} text-white`}>
                      {s.score_ia}% {riskLabel}
                    </span>
                  </div>
                  <div className="h-2.5 bg-white rounded-full overflow-hidden shadow-sm">
                    <div className={`h-full bg-gradient-to-r ${color} rounded-full transition-all duration-700`} style={{ width: `${s.score_ia}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabs */}
      <div>
        <div className="flex gap-2 p-2 bg-gray-100 rounded-2xl w-fit mb-8">
          {(["investigador", "revisor"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-6 py-2.5 text-sm font-bold rounded-xl transition-all capitalize ${
                tab === t 
                  ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg" 
                  : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
              }`}
            >
              Vista {t}
            </button>
          ))}
        </div>

        {/* Vista investigador */}
        {tab === "investigador" && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-3xl p-6">
              <p className="text-gray-900 leading-relaxed font-medium">{MOCK.reporte_investigador.resumen}</p>
            </div>
            
            {MOCK.checks.map((c) => {
              const sev = c.score >= 80 
                ? { badge: "bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200", label: "✅ Aprobado", color: "text-green-600" }
                : c.score >= 60 
                ? { badge: "bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 border border-amber-200", label: "⚠️ Atención", color: "text-amber-600" }
                : { badge: "bg-gradient-to-r from-red-100 to-rose-100 text-red-700 border border-red-200", label: "❌ Crítico", color: "text-red-600" };
              
              return (
                <div key={c.id} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${sev.color} bg-opacity-10`}>
                      {c.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">{c.label}</h3>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${sev.badge}`}>
                          {sev.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{c.resumen}</p>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden max-w-xs">
                          <div 
                            className={`h-full ${
                              c.score >= 80 ? "bg-gradient-to-r from-green-400 to-emerald-500" :
                              c.score >= 60 ? "bg-gradient-to-r from-amber-400 to-yellow-500" :
                              "bg-gradient-to-r from-red-400 to-rose-500"
                            }`} 
                            style={{ width: `${c.score}%` }} 
                          />
                        </div>
                        <span className="text-lg font-bold text-gray-900 min-w-[60px] text-right">{c.score}/100</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Vista revisor */}
        {tab === "revisor" && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 bg-gray-50 border border-gray-200 p-4 rounded-2xl">
              📊 Detalle técnico con evidencia y ubicación exacta. <br className="hidden sm:block" />
              Ponderación: <span className="font-bold">IA 30%</span> · <span className="font-bold">Citas 25%</span> · <span className="font-bold">Patrones 20%</span> · <span className="font-bold">Sin respaldo 15%</span> · <span className="font-bold">Inyección 10%</span>
            </p>
            {MOCK.checks.map((c) => {
              const isOpen = openCheck === c.id;
              const barColor = c.score >= 80 ? "from-green-400 to-emerald-500" : c.score >= 60 ? "from-amber-400 to-yellow-500" : "from-red-400 to-rose-500";
              return (
                <div key={c.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                  <button
                    onClick={() => setOpenCheck(isOpen ? null : c.id)}
                    className="w-full flex items-center gap-4 p-6 text-left hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 transition-all"
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white flex-shrink-0 bg-gradient-to-r ${barColor}`}>
                      {c.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-bold text-gray-900 text-lg">{c.label}</h4>
                        <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-lg">peso {c.peso}</span>
                      </div>
                      <div className="h-2 w-64 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full bg-gradient-to-r ${barColor} rounded-full`} style={{ width: `${c.score}%` }} />
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-2xl font-bold text-gray-900">{c.score}</span>
                      <span className="text-sm text-gray-500">/100</span>
                      {isOpen
                        ? <ChevronUp className="w-5 h-5 text-blue-600" />
                        : <ChevronDown className="w-5 h-5 text-gray-400" />}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-6 border-t border-gray-100 pt-6 space-y-4">
                      <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
                        <p className="text-sm text-gray-900 leading-relaxed font-medium">{c.resumen}</p>
                      </div>
                      <div className="space-y-2">
                        <h5 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Hallazgos</h5>
                        {c.hallazgos.map((h, i) => (
                          <div key={i} className="flex items-start gap-3 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-3.5 hover:border-blue-200 transition-colors">
                            <span className="font-mono text-xs font-bold text-blue-600 flex-shrink-0 bg-blue-100 px-2.5 py-1 rounded min-w-[32px] text-center">
                              {String(i + 1).padStart(2, "0")}
                            </span>
                            <p className="text-sm text-gray-700 leading-relaxed pt-0.5">{h}</p>
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
