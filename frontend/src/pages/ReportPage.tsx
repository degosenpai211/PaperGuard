import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Bot, ShieldAlert, BookOpen, Repeat2, AlertTriangle, ChevronDown, ChevronUp, ArrowLeft, Loader2 } from "lucide-react";
import ScoreGauge from "../components/ScoreGauge";
import VerdictBadge from "../components/VerdictBadge";
import { getAuditResult } from "../api";
import type { AuditResult, Verdict } from "../types";

const CHECK_META: Record<string, { label: string; peso: string; icon: React.ReactNode }> = {
  ai_detector: { label: "Detector de contenido IA",    peso: "30%", icon: <Bot className="w-4 h-4" /> },
  injection:   { label: "Inyección de prompts",        peso: "10%", icon: <ShieldAlert className="w-4 h-4" /> },
  citations:   { label: "Exactitud de citas",          peso: "25%", icon: <BookOpen className="w-4 h-4" /> },
  patterns:    { label: "Patrones repetitivos",        peso: "20%", icon: <Repeat2 className="w-4 h-4" /> },
  unsupported: { label: "Afirmaciones sin respaldo",   peso: "15%", icon: <AlertTriangle className="w-4 h-4" /> },
};

function checkHallazgos(id: string, data: Record<string, unknown>): string[] {
  const list: string[] = [];
  if (id === "citations") {
    const items = (data.no_encontradas as string[] | undefined) ?? [];
    items.slice(0, 5).forEach((r) => list.push(`Referencia no verificada: ${r}`));
  } else if (id === "patterns") {
    const items = (data.repetidos as Array<{ par: number[]; similitud: number }> | undefined) ?? [];
    items.slice(0, 5).forEach((r) => list.push(`Párrafos ${r.par[0] + 1} y ${r.par[1] + 1} — similitud ${(r.similitud * 100).toFixed(0)}%`));
  } else if (id === "injection") {
    const items = (data.hallazgos as Array<{ tipo: string; campo?: string; pagina?: number; preview?: string }> | undefined) ?? [];
    items.slice(0, 5).forEach((h) =>
      list.push(h.tipo === "metadata" ? `Metadata sospechosa: campo "${h.campo}"` : `Texto oculto pág. ${h.pagina}: "${h.preview}"`)
    );
  } else if (id === "ai_detector" && data.error) {
    list.push(`Servicio IA no disponible: ${data.error}`);
  }
  return list.length ? list : ["Sin hallazgos registrados para este check."];
}

function checkResumen(id: string, riskScore: number): string {
  const safe = 100 - riskScore;
  if (id === "ai_detector") return riskScore > 50 ? `Score de riesgo IA: ${riskScore}/100. Se detectaron posibles patrones de contenido generado.` : `Score de riesgo IA: ${riskScore}/100. Sin patrones significativos de IA.`;
  if (id === "citations") return `${safe}% de las referencias pudo verificarse en CrossRef. ${riskScore}% marcadas como no encontradas.`;
  if (id === "patterns") return riskScore > 0 ? `Se detectaron fragmentos con similitud alta entre párrafos.` : "Sin patrones repetitivos significativos.";
  if (id === "injection") return riskScore > 0 ? "Se encontraron indicios de texto oculto o metadata sospechosa." : "Sin texto oculto, metadata limpia.";
  return "Check pendiente de implementación.";
}

type Tab = "investigador" | "revisor";

export default function ReportPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("investigador");
  const [openCheck, setOpenCheck] = useState<string | null>(null);
  const [data, setData] = useState<AuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getAuditResult(id)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Error al cargar el reporte"));
  }, [id]);

  if (error) {
    return (
      <div className="max-w-xl mx-auto text-center py-20">
        <p className="text-red-600 font-semibold mb-4">{error}</p>
        <button onClick={() => navigate("/")} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm">
          Volver al inicio
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-xl mx-auto flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="text-gray-500 text-sm">Cargando reporte…</p>
      </div>
    );
  }

  // Invertir score_global (riesgo → seguridad) para los gauges del frontend
  const displayScore = 100 - data.score_global;
  const checks = Object.entries(data.checks).map(([checkId, check]) => ({
    id: checkId,
    ...CHECK_META[checkId],
    score: 100 - check.score,   // convertir riesgo → seguridad
    riskScore: check.score,
    resumen: checkResumen(checkId, check.score),
    hallazgos: checkHallazgos(checkId, check.data),
  }));
  const secciones = Object.entries(data.secciones).map(([nombre, s]) => ({
    nombre,
    score_ia: s.score_ia,
    score_confianza: 75,
  }));

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
              <span>✅ Análisis completado</span>
            </div>
          </div>
        </div>
      </div>

      {/* Score + Veredicto */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center">
          <ScoreGauge score={displayScore} />
        </div>
        <div>
          <VerdictBadge verdict={data.veredicto as Verdict} />
        </div>
      </div>

      {/* Secciones por score IA */}
      {secciones.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-lg">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Análisis por sección</h2>
          <div className="space-y-4">
            {secciones.map((s) => {
              const color = s.score_ia >= 70 ? "from-red-400 to-red-500" : s.score_ia >= 45 ? "from-amber-400 to-amber-500" : "from-green-400 to-emerald-500";
              const riskLabel = s.score_ia >= 70 ? "Alto riesgo IA" : s.score_ia >= 45 ? "Riesgo medio" : "Bajo riesgo";
              return (
                <div key={s.nombre} className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-gray-50 to-gray-100">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-gray-900 capitalize">{s.nombre}</h3>
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
      )}

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
              <p className="text-gray-900 leading-relaxed font-medium">{data.reporte_investigador.resumen}</p>
            </div>

            {checks.map((c) => {
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
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${sev.badge}`}>{sev.label}</span>
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
            {checks.map((c) => {
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
                      {isOpen ? <ChevronUp className="w-5 h-5 text-blue-600" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
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
                          <div key={i} className="flex items-start gap-3 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-3.5">
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
