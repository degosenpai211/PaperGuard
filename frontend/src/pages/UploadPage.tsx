import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, FileText, X, AlertCircle, ShieldCheck, BookOpen, Cpu, BarChart3 } from "lucide-react";
import { submitAudit } from "../api";

const FEATURES = [
  { icon: <Cpu className="w-5 h-5 text-brand" />, label: "Detector de contenido IA", desc: "Identifica secciones con alta probabilidad de ser generadas por IA" },
  { icon: <BookOpen className="w-5 h-5 text-brand" />, label: "Validación de citas", desc: "Cruza referencias contra CrossRef y Semantic Scholar" },
  { icon: <BarChart3 className="w-5 h-5 text-brand" />, label: "Patrones repetitivos", desc: "Detecta frases y estructuras duplicadas mediante TF-IDF" },
  { icon: <ShieldCheck className="w-5 h-5 text-brand" />, label: "Inyección de prompts", desc: "Analiza texto oculto, metadata y capas del PDF" },
];

export default function UploadPage() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  function validateAndSet(f: File) {
    if (f.type !== "application/pdf") {
      setFileError("El archivo debe ser un PDF.");
      return;
    }
    if (f.size > 20 * 1024 * 1024) {
      setFileError("El archivo supera el límite de 20 MB.");
      return;
    }
    setFileError(null);
    setFile(f);
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) validateAndSet(dropped);
  }

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0];
    if (picked) validateAndSet(picked);
  }

  async function handleSubmit() {
    if (!file) return;
    setLoading(true);
    setApiError(null);
    try {
      // Con el backend real: const { audit_id } = await submitAudit(file);
      // Para demo visual, usamos un ID simulado:
      await new Promise((r) => setTimeout(r, 800));
      const audit_id = "demo-" + Math.random().toString(36).slice(2, 8);
      navigate(`/status/${audit_id}`);
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : "Error desconocido");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Hero */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-brand/10 text-brand text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
          <ShieldCheck className="w-3.5 h-3.5" /> Copiloto de revisión editorial en español
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Auditá tu paper antes de enviarlo
        </h1>
        <p className="text-gray-500 text-sm max-w-md mx-auto">
          PaperGuard analiza tu manuscrito con IA y señala secciones de riesgo, referencias no verificables e incoherencias editoriales.
        </p>
      </div>

      {/* Features */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        {FEATURES.map((f) => (
          <div key={f.label} className="bg-white border border-gray-100 rounded-xl p-4 flex gap-3">
            <div className="flex-shrink-0 mt-0.5">{f.icon}</div>
            <div>
              <p className="text-sm font-semibold text-gray-800">{f.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Upload */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Subir paper</h2>

        {!file ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors
              ${dragging ? "border-brand bg-brand/5" : "border-gray-200 hover:border-brand/50 hover:bg-gray-50"}
              ${fileError ? "border-red-300 bg-red-50" : ""}`}
          >
            <Upload className="mx-auto mb-3 text-gray-300 w-9 h-9" />
            <p className="text-sm font-medium text-gray-700">
              Arrastrá el PDF o{" "}
              <span className="text-brand underline underline-offset-2">hacé click para elegirlo</span>
            </p>
            <p className="text-xs text-gray-400 mt-1.5">Solo PDF · Máximo 20 MB</p>
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={onFileChange}
            />
          </div>
        ) : (
          <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl">
            <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center flex-shrink-0">
              <FileText className="text-brand w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">{file.name}</p>
              <p className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <button
              onClick={() => { setFile(null); if (inputRef.current) inputRef.current.value = ""; }}
              className="text-gray-300 hover:text-red-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {fileError && (
          <p className="text-xs text-red-500 mt-2 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" /> {fileError}
          </p>
        )}

        {apiError && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
            {apiError}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!file || loading}
          className="mt-5 w-full py-3 rounded-xl bg-brand text-white font-semibold text-sm
            hover:bg-brand-dark active:scale-95 transition-all
            disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          {loading ? "Enviando…" : "Iniciar auditoría"}
        </button>

        <p className="text-xs text-gray-400 text-center mt-3">
          El análisis demora entre 2 y 5 minutos. Te avisamos cuando esté listo.
          <br />
          Los manuscritos son procesados de forma confidencial y no se almacenan.
        </p>
      </div>
    </div>
  );
}
