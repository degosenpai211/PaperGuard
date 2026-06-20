import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, FileText, X, AlertCircle, RefreshCw, Cpu, BookOpen, BarChart3, ShieldCheck, Plus, Bot, AlertTriangle } from "lucide-react";
import { saveAnalysis } from "../store";

const MODULES = [
  { icon: Bot,           label: "Detector IA",         desc: "Identifica texto generado por LLMs.", weight: "30%" },
  { icon: BookOpen,      label: "Validación de citas",  desc: "Cruza referencias contra CrossRef y Semantic Scholar.", weight: "25%" },
  { icon: BarChart3,     label: "Patrones repetitivos", desc: "Detecta frases duplicadas mediante TF-IDF.", weight: "20%" },
  { icon: AlertTriangle, label: "Sin respaldo",         desc: "Afirmaciones factuales sin cita de respaldo.", weight: "15%" },
  { icon: ShieldCheck,   label: "Inyección de prompts", desc: "Texto oculto, metadata alterada y capas OCG.", weight: "10%" },
];

export default function AnalysisPage() {
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
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Análisis de documentos</h1>
          <p className="text-sm text-on-surface-variant mt-1">Subí tu manuscrito y PaperGuard lo auditará con IA avanzada.</p>
        </div>
        <div className="flex items-center gap-2 bg-secondary-container text-primary text-xs font-bold px-3 py-1.5 rounded-full border border-primary/20">
          <Cpu className="w-3.5 h-3.5" /> 5 módulos activos · Análisis en paralelo
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-4">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6">
            <h2 className="text-sm font-bold text-on-surface mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4" /> Nuevo análisis
            </h2>

            {!file ? (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => inputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-14 text-center cursor-pointer transition-all duration-200 ${
                  dragging ? "border-primary bg-secondary-container/30" : "border-outline-variant hover:border-primary/50 hover:bg-surface-container-low"
                } ${fileError ? "border-error bg-error-container/20" : ""}`}
              >
                <div className={`mb-3 inline-flex p-3 rounded-full ${dragging ? "bg-secondary-container" : "bg-surface-container"}`}>
                  <Upload className={`w-7 h-7 ${dragging ? "text-primary" : "text-on-surface-variant"}`} />
                </div>
                <p className="text-sm font-semibold text-on-surface">
                  {dragging ? "Suelta el PDF aquí" : "Arrastrá tu PDF o hacé click"}
                </p>
                <p className="text-xs text-on-surface-variant mt-1">Máximo 20 MB · Solo archivos PDF</p>
                <input ref={inputRef} type="file" accept="application/pdf" className="hidden"
                  onChange={(e: ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) validateAndSet(f); }} />
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
                <button onClick={() => setFile(null)} className="p-1.5 hover:bg-error-container rounded-lg text-on-surface-variant hover:text-error transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {fileError && (
              <div className="mt-3 flex items-center gap-2 p-3 bg-error-container border border-error/20 rounded-lg text-sm text-error">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {fileError}
              </div>
            )}

            <button onClick={handleSubmit} disabled={!file || loading}
              className="mt-4 w-full py-3 rounded-lg bg-primary text-white text-sm font-bold hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" /> Procesando…
                </span>
              ) : "Iniciar auditoría"}
            </button>

            <p className="text-xs text-on-surface-variant text-center mt-3">
              ⏱️ 2–5 minutos · 🔒 Los archivos no se almacenan permanentemente
            </p>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5">
            <h3 className="text-sm font-bold text-on-surface mb-3">Ponderación del score global</h3>
            <div className="flex flex-wrap gap-2">
              {MODULES.map(({ label, weight }) => (
                <span key={label} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border border-primary/20 bg-secondary-container text-primary">
                  {label} <span className="opacity-60">·</span> {weight}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 h-fit">
          <h2 className="text-sm font-bold text-on-surface mb-4">Módulos de detección</h2>
          <div className="space-y-4">
            {MODULES.map(({ icon: Icon, label, desc, weight }) => (
              <div key={label} className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-secondary-container flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-on-surface">{label}</p>
                    <span className="text-xs font-mono font-bold text-on-surface-variant">{weight}</span>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
