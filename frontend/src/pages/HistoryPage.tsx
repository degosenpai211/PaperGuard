import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Filter, Upload, FileText, Eye, Download, Trash2, ChevronLeft, ChevronRight, BarChart2, History, Cloud } from "lucide-react";
import { getAnalyses, saveAnalysis } from "../store";

const STATUS_MAP: Record<string, { label: string; dotClass: string; textClass: string }> = {
  completed:  { label: "COMPLETED",  dotClass: "bg-tertiary-container",  textClass: "text-tertiary-container" },
  flagged:    { label: "FLAGGED",    dotClass: "bg-error animate-pulse", textClass: "text-error" },
  processing: { label: "PROCESSING", dotClass: "bg-primary animate-pulse",textClass: "text-primary" },
};

export default function HistoryPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState("Last 30 Days");
  const [confidence, setConfidence] = useState("All Levels");
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [, forceUpdate] = useState(0);

  const allAnalyses = getAnalyses();

  const filtered = allAnalyses.filter((d) => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase());
    const matchConf =
      confidence === "All Levels" ? true :
      confidence === "High (>90%)" ? d.score >= 90 :
      confidence === "Medium (70-90%)" ? d.score >= 70 && d.score < 90 :
      d.score < 70;
    return matchSearch && matchConf;
  });

  function handleDelete(id: string) {
    if (!confirm("¿Eliminar este análisis?")) return;
    const list = getAnalyses().filter((a) => a.id !== id);
    localStorage.setItem("paperguard_analyses", JSON.stringify(list));
    forceUpdate((n) => n + 1);
  }

  const avgScore = filtered.length > 0
    ? Math.round(filtered.reduce((s, a) => s + a.score, 0) / filtered.length)
    : 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Analysis History</h1>
          <p className="text-sm text-on-surface-variant mt-1">Revisá y administrá tus auditorías anteriores.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-surface-container-lowest border border-outline-variant text-on-surface text-sm font-medium rounded-lg hover:bg-surface-container-low transition-colors">
            <Filter className="w-4 h-4" /> Filters
          </button>
          <button onClick={() => navigate("/analysis")}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:opacity-90 transition-opacity">
            <Upload className="w-4 h-4" /> New Analysis
          </button>
        </div>
      </div>

      {/* Filters + stat */}
      <div className="grid grid-cols-4 gap-4">
        <div className="col-span-3 bg-surface-container-lowest border border-outline-variant rounded-xl p-5">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-on-surface-variant block mb-1.5">Search Documents</label>
              <div className="relative">
                <FileText className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="e.g. paper.pdf"
                  className="w-full pl-9 pr-3 py-2 bg-surface-container border border-outline-variant rounded-lg text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface-variant block mb-1.5">Date Range</label>
              <select value={dateRange} onChange={(e) => setDateRange(e.target.value)}
                className="w-full px-3 py-2 bg-surface-container border border-outline-variant rounded-lg text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option>Last 30 Days</option>
                <option>Last Quarter</option>
                <option>Custom Range</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface-variant block mb-1.5">Confidence</label>
              <select value={confidence} onChange={(e) => setConfidence(e.target.value)}
                className="w-full px-3 py-2 bg-surface-container border border-outline-variant rounded-lg text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option>All Levels</option>
                <option>High (&gt;90%)</option>
                <option>Medium (70-90%)</option>
                <option>Low (&lt;70%)</option>
              </select>
            </div>
          </div>
        </div>
        <div className="bg-primary rounded-xl p-5 text-white">
          <p className="text-xs font-bold uppercase tracking-wider text-white/70 mb-1">History Total</p>
          <p className="text-4xl font-bold">{allAnalyses.length}</p>
          <p className="text-xs text-white/60 mt-2">
            {allAnalyses.length === 0 ? "Sin análisis aún" : `Score promedio: ${avgScore}%`}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-outline-variant bg-surface-container-low">
              {["Document Name", "Date Analyzed", "Overall Score", "Status", "Actions"].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 bg-surface-container rounded-full flex items-center justify-center">
                      <FileText className="w-6 h-6 text-on-surface-variant" />
                    </div>
                    <p className="text-sm font-semibold text-on-surface">No hay análisis todavía</p>
                    <p className="text-xs text-on-surface-variant">Los documentos aparecerán aquí después de subir un PDF.</p>
                    <button onClick={() => navigate("/analysis")}
                      className="mt-2 flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:opacity-90 transition-opacity">
                      <Upload className="w-4 h-4" /> Subir documento
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((doc) => {
                const st = STATUS_MAP[doc.status] ?? STATUS_MAP["completed"];
                const barColor = doc.score >= 80 ? "bg-primary" : doc.score >= 60 ? "bg-primary-fixed-dim" : "bg-error";
                const scoreColor = doc.score >= 80 ? "text-primary" : doc.score >= 60 ? "text-on-surface" : "text-error";
                const isHovered = hoveredRow === doc.id;
                return (
                  <tr key={doc.id}
                    className="border-b border-outline-variant last:border-0 hover:bg-surface-container-low transition-colors cursor-pointer"
                    onMouseEnter={() => setHoveredRow(doc.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                    onClick={() => doc.status !== "processing" && navigate(`/report/${doc.id}`)}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-on-surface truncate max-w-[200px]">{doc.name}</p>
                          <p className="text-xs text-on-surface-variant">{doc.size}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-on-surface">{doc.date}</p>
                      <p className="text-xs text-on-surface-variant">{doc.time}</p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className={`text-base font-bold ${scoreColor}`}>
                          {doc.status === "processing" ? "—" : doc.score}
                        </span>
                        {doc.status !== "processing" && (
                          <div className="w-16 h-1.5 bg-surface-container rounded-full overflow-hidden">
                            <div className={`h-full ${barColor} rounded-full`} style={{ width: `${doc.score}%` }} />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${st.dotClass}`} />
                        <span className={`text-xs font-bold ${st.textClass}`}>{st.label}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className={`flex items-center gap-1 transition-opacity ${isHovered ? "opacity-100" : "opacity-0"}`}>
                        {doc.status !== "processing" && (
                          <button onClick={() => navigate(`/report/${doc.id}`)}
                            className="p-1.5 hover:bg-secondary-container rounded-lg text-on-surface-variant hover:text-primary transition-colors" title="Ver reporte">
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => alert("Descargando… (requiere backend)")}
                          className="p-1.5 hover:bg-surface-container rounded-lg text-on-surface-variant hover:text-on-surface transition-colors" title="Descargar PDF">
                          <Download className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(doc.id)}
                          className="p-1.5 hover:bg-error-container rounded-lg text-on-surface-variant hover:text-error transition-colors" title="Eliminar">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        {filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-outline-variant flex items-center justify-between bg-surface-container-low">
            <p className="text-xs text-on-surface-variant">Showing 1–{filtered.length} of {allAnalyses.length} documents</p>
            <div className="flex items-center gap-1">
              <button disabled className="p-1.5 rounded-lg text-on-surface-variant opacity-30"><ChevronLeft className="w-4 h-4" /></button>
              <button className="w-7 h-7 rounded-lg text-xs font-bold bg-primary text-white">1</button>
              <button disabled className="p-1.5 rounded-lg text-on-surface-variant opacity-30"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>

      {/* Footer stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: BarChart2, label: "Accuracy Rating", value: allAnalyses.length > 0 ? `${avgScore}%` : "—",          bg: "bg-secondary-container",    iconColor: "text-primary" },
          { icon: History,   label: "Analyses Today",  value: allAnalyses.length > 0 ? String(allAnalyses.length) : "—", bg: "bg-tertiary-container/20", iconColor: "text-tertiary-container" },
          { icon: Cloud,     label: "Cloud Sync",      value: "Live",                                                    bg: "bg-primary-container/20",  iconColor: "text-primary" },
        ].map(({ icon: Icon, label, value, bg, iconColor }) => (
          <div key={label} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-full ${bg} flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-5 h-5 ${iconColor}`} />
            </div>
            <div>
              <p className="text-xs text-on-surface-variant font-medium uppercase tracking-wider">{label}</p>
              <p className="text-xl font-bold text-on-surface">{value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
