import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, FileText, X, AlertCircle, ShieldCheck, BookOpen, Cpu, BarChart3 } from "lucide-react";
import { submitAudit } from "../api";

const FEATURES = [
  { icon: <Cpu className="w-5 h-5" />, label: "Detector de contenido IA", desc: "Identifica secciones con alta probabilidad de ser generadas por IA" },
  { icon: <BookOpen className="w-5 h-5" />, label: "Validación de citas", desc: "Cruza referencias contra CrossRef y Semantic Scholar" },
  { icon: <BarChart3 className="w-5 h-5" />, label: "Patrones repetitivos", desc: "Detecta frases y estructuras duplicadas mediante TF-IDF" },
  { icon: <ShieldCheck className="w-5 h-5" />, label: "Inyección de prompts", desc: "Analiza texto oculto, metadata y capas del PDF" },
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
      const { audit_id } = await submitAudit(file);
      navigate(`/status/${audit_id}`);
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : "Error desconocido");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Hero */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-bold px-4 py-2 rounded-full border border-blue-100 mb-6">
          <ShieldCheck className="w-4 h-4" /> Auditoría editorial impulsada por IA
        </div>
        <h1 className="text-5xl font-bold text-gray-900 mb-4 leading-tight">
          Auditá tu paper
          <br />
          <span className="bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">antes de enviarlo</span>
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
          PaperGuard analiza tu manuscrito con IA avanzada y señala secciones de riesgo, referencias no verificables e incoherencias editoriales.
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-2 gap-4 mb-10">
        {FEATURES.map((f) => (
          <div 
            key={f.label} 
            className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-lg hover:border-blue-200 transition-all duration-300 group"
          >
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center text-blue-600 group-hover:text-blue-700 transition-colors">
                {f.icon}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">{f.label}</p>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Upload Section */}
      <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-lg">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Subir tu manuscrito</h2>

        {!file ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-all duration-300
              ${dragging 
                ? "border-blue-500 bg-blue-50 shadow-md" 
                : "border-gray-300 hover:border-blue-300 hover:bg-gray-50"
              }
              ${fileError ? "border-red-300 bg-red-50" : ""}`}
          >
            <div className={`mb-4 inline-flex p-4 rounded-full transition-colors ${
              dragging ? "bg-blue-100" : "bg-gray-100"
            }`}>
              <Upload className={`w-8 h-8 ${dragging ? "text-blue-600" : "text-gray-400"}`} />
            </div>
            <p className="text-base font-bold text-gray-900">
              {dragging ? "Suelta el PDF aquí" : "Arrastrá tu PDF o hacé click"}
            </p>
            <p className="text-sm text-gray-600 mt-2">Máximo 20 MB · Solo archivos PDF</p>
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={onFileChange}
            />
          </div>
        ) : (
          <div className="flex items-center gap-4 p-5 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
              <FileText className="text-green-600 w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">{file.name}</p>
              <p className="text-xs text-gray-600 mt-0.5">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <button
              onClick={() => { setFile(null); if (inputRef.current) inputRef.current.value = ""; }}
              className="p-2 rounded-lg hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {fileError && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{fileError}</span>
          </div>
        )}

        {apiError && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {apiError}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!file || loading}
          className="mt-6 w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold text-base
            hover:shadow-lg hover:from-blue-700 hover:to-blue-800 active:scale-95 transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Analizando…
            </div>
          ) : (
            "Iniciar auditoría"
          )}
        </button>

        <p className="text-xs text-gray-600 text-center mt-4 leading-relaxed">
          ⏱️ El análisis demora entre 2 y 5 minutos. Te avisamos cuando esté listo.
          <br />
          🔒 Los manuscritos son procesados de forma confidencial y no se almacenan.
        </p>
      </div>
    </div>
  );
}
