import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload, FileText, X, AlertCircle, RefreshCw,
  ZoomIn, ZoomOut, ChevronLeft, ChevronRight,
  Sparkles, Save, Download, TrendingUp, BookCheck,
  CheckCircle2, AlertTriangle, Bot, Brain,
} from "lucide-react";
import { saveAnalysis, setPdfUrl, getPdfUrl, getAnalyses } from "../store";
import type { Analysis } from "../store";

/* ─── helpers ─────────────────────────────────────────────── */
function scoreLabel(s: number) {
  return s >= 80 ? "HIGH CONFIDENCE" : s >= 60 ? "MEDIUM CONFIDENCE" : "LOW CONFIDENCE";
}
function scoreColor(s: number) {
  return s >= 80 ? "text-tertiary-container" : s >= 60 ? "text-primary" : "text-error";
}
function barWidth(s: number) {
  return `${Math.round(s * 0.7)}%`;
}
function barWidthAccent(s: number) {
  return `${Math.round(s * 0.2)}%`;
}

/* ─── Upload form (shown when no analysis exists) ─────────── */
function UploadForm() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function validateAndSet(f: File) {
    if (f.type !== "application/pdf") { setFileError("El archivo debe ser un PDF."); return; }
    if (f.size > 20 * 1024 * 1024) { setFileError("El archivo supera el límite de 20 MB."); return; }
    setFileError(null);
    setFile(f);
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) validateAndSet(f);
  }

  async function handleSubmit() {
    if (!file) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    const id = "demo-" + Math.random().toString(36).slice(2, 8);
    const now = new Date();
    setPdfUrl(id, file);
    saveAnalysis({
      id,
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
      date: now.toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" }),
      time: now.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }),
      score: 0,
      status: "processing",
    });
    navigate(`/status/${id}`);
  }

  return (
    <div className="flex items-center justify-center h-full p-6">
      <div className="w-full max-w-lg space-y-5">
        <div className="text-center">
          <div className="w-14 h-14 bg-secondary-container rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Brain className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-on-surface">AI Workspace</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Subí un PDF para abrir el workspace de análisis inteligente.
          </p>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 space-y-4">
          {!file ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200 ${
                dragging
                  ? "border-primary bg-secondary-container/30"
                  : "border-outline-variant hover:border-primary/50 hover:bg-surface-container-low"
              } ${fileError ? "border-error bg-error-container/20" : ""}`}
            >
              <div className={`mb-3 inline-flex p-3 rounded-full ${dragging ? "bg-secondary-container" : "bg-surface-container"}`}>
                <Upload className={`w-7 h-7 ${dragging ? "text-primary" : "text-on-surface-variant"}`} />
              </div>
              <p className="text-sm font-semibold text-on-surface">
                {dragging ? "Suelta el PDF aquí" : "Arrastrá tu PDF o hacé click"}
              </p>
              <p className="text-xs text-on-surface-variant mt-1">Máximo 20 MB · Solo archivos PDF</p>
              <input
                ref={inputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  const f = e.target.files?.[0];
                  if (f) validateAndSet(f);
                }}
              />
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 bg-surface-container border border-outline-variant rounded-xl">
              <div className="w-10 h-10 rounded-lg bg-secondary-container flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-on-surface truncate">{file.name}</p>
                <p className="text-xs text-on-surface-variant">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <button
                onClick={() => setFile(null)}
                className="p-1.5 hover:bg-error-container rounded-lg text-on-surface-variant hover:text-error transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {fileError && (
            <div className="flex items-center gap-2 p-3 bg-error-container border border-error/20 rounded-lg text-sm text-error">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {fileError}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={!file || loading}
            className="w-full py-3 rounded-lg bg-primary text-white text-sm font-bold hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" /> Procesando…
              </span>
            ) : "Abrir en AI Workspace"}
          </button>

          <p className="text-xs text-on-surface-variant text-center">
            ⏱️ 2–5 minutos · 🔒 Archivos no almacenados permanentemente
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Split-view workspace ────────────────────────────────── */
function AnalysisWorkspace({ doc }: { doc: Analysis }) {
  const navigate = useNavigate();
  const [zoom, setZoom] = useState(100);
  const [page, setPage] = useState(1);
  const totalPages = 24;
  const pdfUrl = getPdfUrl(doc.id);

  const score = doc.score;
  const isHigh = score >= 80;
  const isMid = score >= 60 && score < 80;

  const insights = isHigh
    ? [
        {
          level: "Risk Level: Low",
          levelColor: "text-primary",
          page: "Page 1, Para 4",
          text: "Se detectaron variaciones menores en el estilo de redacción entre las secciones 4.2 y 5.1.",
          actions: [
            { label: "Highlight in Doc", onClick: () => {} },
            { label: "Mark Resolved", onClick: () => {}, muted: true },
          ],
        },
        {
          level: "Risk Level: Low",
          levelColor: "text-primary",
          page: "Page 3, Para 2",
          text: "Algunas cláusulas de cumplimiento pueden reforzarse con bibliografía adicional.",
          actions: [{ label: "View Suggested Edit", onClick: () => {} }],
        },
      ]
    : isMid
    ? [
        {
          level: "Risk Level: Medium",
          levelColor: "text-primary",
          page: "Page 1, Para 4",
          text: "Lenguaje contradictorio detectado en las políticas de retención de datos entre §4.2 y §5.1.",
          actions: [
            { label: "Highlight in Doc", onClick: () => {} },
            { label: "Mark Resolved", onClick: () => {}, muted: true },
          ],
        },
        {
          level: "Action Required",
          levelColor: "text-error",
          page: "Page 3, Para 2",
          text: "Cláusula de cumplimiento esencial ausente para GDPR Artículo 28.",
          actions: [{ label: "View Suggested Edit", onClick: () => {} }],
        },
        {
          level: "Risk Level: Medium",
          levelColor: "text-primary",
          page: "Page 5, Para 1",
          text: "28% del texto presenta rasgos de generación por IA en introducción y conclusiones.",
          actions: [{ label: "Highlight in Doc", onClick: () => {} }],
        },
        {
          level: "Risk Level: Low",
          levelColor: "text-primary",
          page: "Page 8, Para 3",
          text: "Tres referencias bibliográficas no pudieron ser validadas en CrossRef.",
          actions: [{ label: "Find Correct Source", onClick: () => {} }],
        },
      ]
    : [
        {
          level: "Action Required",
          levelColor: "text-error",
          page: "Page 1, Para 2",
          text: "Alto porcentaje de contenido generado por IA (>50%) en secciones críticas.",
          actions: [{ label: "View Details", onClick: () => {} }],
        },
        {
          level: "Action Required",
          levelColor: "text-error",
          page: "Page 3, Para 2",
          text: "Cláusulas de cumplimiento críticas ausentes. Requiere revisión exhaustiva.",
          actions: [{ label: "View Suggested Edit", onClick: () => {} }],
        },
        {
          level: "Action Required",
          levelColor: "text-error",
          page: "Page 5, Para 1",
          text: "Múltiples referencias citadas no encontradas en ninguna base de datos científica.",
          actions: [{ label: "Find Correct Source", onClick: () => {} }],
        },
        {
          level: "Risk Level: High",
          levelColor: "text-error",
          page: "Page 7, Para 4",
          text: "Afirmaciones factuales sin respaldo bibliográfico en 4 pasajes del documento.",
          actions: [{ label: "Highlight in Doc", onClick: () => {} }],
        },
      ];

  return (
    <div className="flex h-full overflow-hidden">
      {/* LEFT: PDF Viewer */}
      <div className="flex flex-col border-r border-outline-variant bg-surface-dim/20" style={{ width: "55%" }}>
        {/* PDF toolbar */}
        <div className="h-12 bg-surface-container-lowest border-b border-outline-variant flex items-center justify-between px-4 flex-shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary flex-shrink-0" />
            <span className="text-sm font-semibold truncate max-w-[220px]">{doc.name}</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setZoom((z) => Math.max(50, z - 25))}
              className="p-1 hover:bg-surface-container rounded transition-colors"
            >
              <ZoomOut className="w-3.5 h-3.5 text-on-surface-variant" />
            </button>
            <span className="text-xs font-mono px-2 text-on-surface-variant select-none">{zoom}%</span>
            <button
              onClick={() => setZoom((z) => Math.min(200, z + 25))}
              className="p-1 hover:bg-surface-container rounded transition-colors"
            >
              <ZoomIn className="w-3.5 h-3.5 text-on-surface-variant" />
            </button>
            <div className="w-px h-4 bg-outline-variant mx-1" />
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1 hover:bg-surface-container rounded transition-colors disabled:opacity-30"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-on-surface-variant" />
            </button>
            <span className="text-xs font-mono px-2 text-on-surface-variant select-none">{page} / {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1 hover:bg-surface-container rounded transition-colors disabled:opacity-30"
            >
              <ChevronRight className="w-3.5 h-3.5 text-on-surface-variant" />
            </button>
          </div>
        </div>

        {/* PDF canvas */}
        <div className="flex-grow overflow-hidden relative">
          {pdfUrl ? (
            <iframe
              src={`${pdfUrl}#zoom=${zoom}&page=${page}`}
              className="w-full h-full border-none"
              title={doc.name}
            />
          ) : (
            /* Fallback: simulated canvas when no blob URL (e.g. after page refresh) */
            <div
              className="w-full h-full overflow-auto p-8 flex justify-center custom-scrollbar"
              style={{
                backgroundImage: "radial-gradient(#cbd5e1 0.5px, transparent 0.5px)",
                backgroundSize: "16px 16px",
              }}
            >
              <div
                className="bg-white shadow-lg w-full max-w-[700px] min-h-[1000px] p-12 relative border border-outline-variant space-y-5"
                style={{ transformOrigin: "top center", transform: `scale(${zoom / 100})` }}
              >
                <div className="h-7 bg-surface-container-high w-3/4 rounded" />
                <div className="space-y-2">
                  <div className="h-3.5 bg-surface-container w-full rounded" />
                  <div className="h-3.5 bg-surface-container w-full rounded" />
                  <div className="h-3.5 bg-surface-container w-5/6 rounded" />
                </div>
                <div className="h-52 bg-surface-container-low w-full rounded-lg border border-outline-variant border-dashed flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-surface-container-high rounded-lg mx-auto mb-2 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-on-surface-variant" />
                    </div>
                    <p className="text-xs text-on-surface-variant">Figure 1 — Technical Diagram</p>
                  </div>
                </div>
                <div className="relative">
                  <div className="absolute -inset-1 bg-primary/10 rounded ring-1 ring-primary/30" />
                  <div className="h-3.5 bg-surface-container w-full rounded" />
                  <div className="h-3.5 bg-surface-container w-11/12 rounded mt-2" />
                  <span className="absolute -right-7 top-0 text-[9px] bg-primary text-white px-1 py-0.5 rounded font-mono">#P1</span>
                </div>
                <div className="space-y-2">
                  <div className="h-3.5 bg-surface-container w-full rounded" />
                  <div className="h-3.5 bg-surface-container w-full rounded" />
                  <div className="h-3.5 bg-surface-container w-2/3 rounded" />
                </div>
                <div className="relative">
                  <div className="absolute -inset-1 bg-tertiary-fixed-dim/20 rounded ring-1 ring-tertiary-container/30" />
                  <div className="h-3.5 bg-surface-container w-full rounded" />
                  <div className="h-3.5 bg-surface-container w-5/6 rounded mt-2" />
                  <span className="absolute -right-7 top-0 text-[9px] bg-tertiary-container text-white px-1 py-0.5 rounded font-mono">#C1</span>
                </div>
                <div className="space-y-2">
                  <div className="h-3.5 bg-surface-container w-full rounded" />
                  <div className="h-3.5 bg-surface-container w-3/4 rounded" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: AI Workspace */}
      <div className="flex flex-col bg-surface border-l border-outline-variant" style={{ width: "45%" }}>
        {/* Workspace header */}
        <div className="h-12 bg-surface-container-lowest border-b border-outline-variant flex items-center justify-between px-4 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-primary">AI Workspace</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/history`)}
              className="flex items-center gap-1 px-2.5 py-1 bg-surface-container-high hover:bg-surface-container-highest rounded text-xs font-mono font-semibold text-on-surface transition-colors"
            >
              <Save className="w-3 h-3" /> Save History
            </button>
            <button
              onClick={() => navigate(`/report/${doc.id}`)}
              className="flex items-center gap-1 px-2.5 py-1 bg-primary text-white hover:opacity-90 rounded text-xs font-mono font-semibold transition-colors"
            >
              <Download className="w-3 h-3" /> Export PDF
            </button>
          </div>
        </div>

        {/* Scrollable panels */}
        <div className="flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar">

          {/* Analysis Integrity */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-base font-bold text-on-surface">Analysis Integrity</h3>
                <p className="text-xs text-on-surface-variant mt-0.5">Validated through 12,000 reference points</p>
              </div>
              <div className="text-right">
                <span className="text-3xl font-bold text-primary">
                  {score}<span className="text-xl text-on-surface-variant">%</span>
                </span>
                <div className={`text-[10px] font-mono font-bold uppercase tracking-wider mt-0.5 ${scoreColor(score)}`}>
                  {scoreLabel(score)}
                </div>
              </div>
            </div>
            <div className="w-full h-3 bg-surface-container-high rounded-full overflow-hidden flex">
              <div className="h-full bg-primary transition-all" style={{ width: barWidth(score) }} />
              <div className="h-full bg-primary-fixed-dim transition-all" style={{ width: barWidthAccent(score) }} />
            </div>
            <div className="flex gap-4 mt-2.5">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-[11px] font-mono text-on-surface-variant">Structural Match</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-primary-fixed-dim" />
                <span className="text-[11px] font-mono text-on-surface-variant">Factual Accuracy</span>
              </div>
            </div>
          </div>

          {/* AI Pattern Detection */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-outline-variant bg-surface-container-low flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold">AI Pattern Detection</h3>
              </div>
              <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase">
                {insights.length} Insights Found
              </span>
            </div>
            <div className="p-3 space-y-2">
              {insights.map((ins, i) => (
                <div
                  key={i}
                  className="cursor-pointer border border-transparent hover:border-primary/20 hover:bg-primary/5 p-3 rounded-lg transition-all"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className={`text-[10px] font-mono font-bold uppercase ${ins.levelColor}`}>
                      {ins.level}
                    </span>
                    <span className="text-[10px] font-mono text-on-surface-variant">{ins.page}</span>
                  </div>
                  <p className="text-xs text-on-surface leading-snug">{ins.text}</p>
                  <div className="mt-1.5 flex gap-2">
                    {ins.actions.map((a, j) => (
                      <button
                        key={j}
                        onClick={a.onClick}
                        className={`text-[11px] font-bold hover:underline ${
                          (a as { muted?: boolean }).muted ? "text-on-surface-variant" : "text-primary"
                        }`}
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Citation Validation */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-outline-variant bg-surface-container-low flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <BookCheck className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold">Citation Validation</h3>
              </div>
              <div className="flex gap-1.5">
                <span className="text-[10px] font-mono border border-outline px-1.5 py-0.5 rounded">IEEE</span>
                <span className="text-[10px] font-mono bg-surface-container-highest px-1.5 py-0.5 rounded">APA 7</span>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-tertiary-container flex-shrink-0 mt-0.5" style={{ fill: "currentColor", fillOpacity: 0.15 }} />
                <div className="flex-grow">
                  <div className="text-xs font-mono font-semibold text-on-surface">[C1] Smith et al. (2023)</div>
                  <p className="text-[11px] text-on-surface-variant leading-tight mt-0.5">
                    Database match confirmed via CrossRef. DOI: 10.1011/x.921
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 border-t border-outline-variant pt-3">
                <AlertTriangle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
                <div className="flex-grow">
                  <div className="text-xs font-mono font-semibold text-on-surface">[C2] Unidentified Reference</div>
                  <p className="text-[11px] text-error leading-tight mt-0.5">
                    {isHigh
                      ? "Referencia verificada parcialmente. Se recomienda confirmar el DOI."
                      : 'El autor citado "Devlin (2019)" no se encuentra en la bibliografía.'}
                  </p>
                  <button className="mt-1.5 text-primary text-[11px] font-bold hover:underline">
                    Find Correct Source
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* AI summarizing panel */}
          <div className="bg-primary-container/20 border border-primary/20 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="flex-grow">
              <div className="text-xs font-bold text-primary">Summarizing Section…</div>
              <div className="w-full h-1 bg-primary/10 rounded-full mt-1.5 overflow-hidden">
                <div className="bg-primary h-full w-[65%] animate-pulse" />
              </div>
            </div>
            <button className="p-1 hover:bg-primary/10 rounded transition-colors">
              <X className="w-4 h-4 text-primary" />
            </button>
          </div>
        </div>

        {/* Footer stats */}
        <div className="h-10 border-t border-outline-variant bg-surface-container-lowest px-4 flex items-center justify-between flex-shrink-0">
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary-fixed-dim" />
              <span className="text-[10px] font-mono text-on-surface-variant uppercase">Engine: DocGPT-4o</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span className="text-[10px] font-mono text-on-surface-variant uppercase">Lat: 240ms</span>
            </div>
          </div>
          <div className="text-[10px] font-mono text-on-surface-variant uppercase tracking-widest">
            Workspace ID: #{doc.id.toUpperCase()}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Page entry ─────────────────────────────────────────── */
export default function AnalysisPage() {
  const analyses = getAnalyses();
  const latestCompleted = analyses
    .filter((a) => a.status === "completed" || a.status === "flagged")
    .slice(-1)[0];

  if (latestCompleted) {
    return <AnalysisWorkspace doc={latestCompleted} />;
  }
  return <UploadForm />;
}
