import { useNavigate } from "react-router-dom";
import { FileText, Download, BarChart2, Plus, ExternalLink, ShieldCheck, ClipboardList, RefreshCw } from "lucide-react";
import { getAnalyses } from "../store";

const QUICK_EXPORT = [
  { icon: ClipboardList, label: "Full Audit Report",  desc: "Documentación completa de deep-scan con riesgos destacados.",   iconBg: "bg-primary-fixed-dim",    iconColor: "text-primary" },
  { icon: ShieldCheck,   label: "Compliance (SOC2)",  desc: "Certificados validados para auditorías regulatorias.",           iconBg: "bg-tertiary-container/30", iconColor: "text-tertiary-container" },
  { icon: BarChart2,     label: "Executive Summary",  desc: "Insights de alto nivel para directivos y stakeholders.",         iconBg: "bg-secondary-container",  iconColor: "text-primary" },
];

export default function ReportsPage() {
  const navigate = useNavigate();
  const analyses = getAnalyses().filter((a) => a.status !== "processing");

  const avgScore = analyses.length > 0
    ? Math.round(analyses.reduce((s, a) => s + a.score, 0) / analyses.length)
    : 0;

  const mostCommonIssue = analyses.length > 0
    ? (avgScore < 70 ? "Citas · CRÍTICO" : "Detector IA · ATENCIÓN")
    : null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Document Reports</h1>
          <p className="text-sm text-on-surface-variant mt-1">Generá, administrá y exportá reportes de auditoría forense.</p>
        </div>
        <button onClick={() => navigate("/analysis")}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> + New Report
        </button>
      </div>

      <div className="grid grid-cols-12 gap-5">
        {/* Left: Analytics */}
        <div className="col-span-4 space-y-4">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-on-surface">Reporting Analytics</h2>

            <div className="pb-4 border-b border-outline-variant">
              <p className="text-xs text-on-surface-variant font-medium uppercase tracking-wider mb-1">Total Reports Exported</p>
              <p className="text-3xl font-bold text-on-surface">{analyses.length}</p>
              <p className="text-xs text-on-surface-variant mt-1">
                {analyses.length === 0 ? "Sin reportes generados aún" : `${analyses.length} análisis completados`}
              </p>
            </div>

            <div className="pb-4 border-b border-outline-variant">
              <p className="text-xs text-on-surface-variant font-medium uppercase tracking-wider mb-1">Most Frequent Issue</p>
              {mostCommonIssue ? (
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-base font-bold text-on-surface">{mostCommonIssue.split(" · ")[0]}</p>
                  <span className="text-xs font-bold text-error bg-error-container px-2 py-0.5 rounded-full">
                    {mostCommonIssue.split(" · ")[1]}
                  </span>
                </div>
              ) : (
                <p className="text-sm text-on-surface-variant mt-1 italic">—</p>
              )}
            </div>

            <div>
              <p className="text-xs text-on-surface-variant font-medium uppercase tracking-wider mb-1">Avg. Confidence Score</p>
              <p className="text-3xl font-bold text-on-surface">{analyses.length > 0 ? `${avgScore}%` : "—"}</p>
              <div className="mt-2 h-1.5 bg-surface-container rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${avgScore}%` }} />
              </div>
            </div>
          </div>

          <div className="bg-primary-container/20 border border-primary/20 rounded-xl p-5 relative overflow-hidden">
            <h3 className="text-sm font-bold text-on-surface mb-1">Advanced Forensic Kit</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed mb-3">
              Desbloqueá análisis profundo de metadata y verificación de compliance.
            </p>
            <button className="text-primary text-xs font-bold hover:underline">Learn More</button>
            <div className="absolute -bottom-4 -right-4 opacity-10">
              <ShieldCheck className="w-24 h-24 text-primary" />
            </div>
          </div>
        </div>

        {/* Right: Quick Export + Table */}
        <div className="col-span-8 space-y-5">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5">
            <h2 className="text-sm font-bold text-on-surface mb-4">Quick Export</h2>
            <div className="grid grid-cols-3 gap-3">
              {QUICK_EXPORT.map(({ icon: Icon, label, desc, iconBg, iconColor }) => (
                <button key={label}
                  onClick={() => alert(`Exportando "${label}"… Disponible con backend conectado.`)}
                  className="text-left p-4 bg-surface-container-low border border-outline-variant rounded-xl hover:border-primary/30 hover:bg-secondary-container/20 transition-all group">
                  <div className={`w-9 h-9 rounded-lg ${iconBg} flex items-center justify-center mb-3`}>
                    <Icon className={`w-5 h-5 ${iconColor}`} />
                  </div>
                  <p className="text-sm font-bold text-on-surface">{label}</p>
                  <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">{desc}</p>
                  <div className="mt-3 flex items-center text-primary text-xs font-bold group-hover:underline">
                    Exportar <ExternalLink className="w-3 h-3 ml-1" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-outline-variant flex items-center justify-between bg-surface-container-low">
              <h2 className="text-sm font-bold text-on-surface">Recent Reports</h2>
              <button onClick={() => navigate("/history")}
                className="flex items-center gap-1 text-xs text-primary font-semibold hover:underline">
                View Archive <ExternalLink className="w-3 h-3" />
              </button>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-outline-variant">
                  {["Report Name", "Type", "Date Generated", "Status", "Action"].map((h) => (
                    <th key={h} className="text-left px-5 py-2.5 text-xs font-bold text-on-surface-variant uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {analyses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-14 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 bg-surface-container rounded-full flex items-center justify-center">
                          <FileText className="w-6 h-6 text-on-surface-variant" />
                        </div>
                        <p className="text-sm font-semibold text-on-surface">No hay reportes todavía</p>
                        <p className="text-xs text-on-surface-variant">Los reportes aparecerán aquí después de completar un análisis.</p>
                        <button onClick={() => navigate("/analysis")}
                          className="mt-1 flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:opacity-90 transition-opacity">
                          <Download className="w-4 h-4" /> Iniciar análisis
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  analyses.slice(0, 8).map((r) => (
                    <tr key={r.id}
                      className="border-b border-outline-variant last:border-0 hover:bg-surface-container-low transition-colors cursor-pointer"
                      onClick={() => navigate(`/report/${r.id}`)}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-on-surface-variant flex-shrink-0" />
                          <span className="text-sm font-medium text-on-surface truncate max-w-[180px]">{r.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-on-surface-variant">Full Audit</td>
                      <td className="px-5 py-3.5 text-sm text-on-surface-variant">{r.date}</td>
                      <td className="px-5 py-3.5">
                        {r.status === "completed" ? (
                          <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-tertiary-container" />
                            <span className="text-xs font-bold text-tertiary-container">Ready</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <RefreshCw className="w-3 h-3 text-error animate-spin" />
                            <span className="text-xs font-bold text-error">Flagged</span>
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => alert("Descargando… (requiere backend)")}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container border border-outline-variant rounded-lg text-xs font-bold text-on-surface hover:bg-surface-container-high transition-colors">
                          <Download className="w-3.5 h-3.5" /> Download PDF
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {analyses.length > 8 && (
              <div className="px-5 py-3 border-t border-outline-variant bg-surface-container-low text-center">
                <button onClick={() => navigate("/history")} className="text-xs text-primary font-semibold hover:underline">
                  Show {analyses.length - 8} more reports
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-on-surface-variant border-t border-outline-variant pt-4">
        <span>© 2025 PaperGuard. Todos los reportes son encriptados con AES-256.</span>
        <div className="flex gap-4">
          <button className="hover:text-primary transition-colors">Privacy Policy</button>
          <button className="hover:text-primary transition-colors">Service Status</button>
          <button className="hover:text-primary transition-colors">Contact Security</button>
        </div>
      </div>
    </div>
  );
}
