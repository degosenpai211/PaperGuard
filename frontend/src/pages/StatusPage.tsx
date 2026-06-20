import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CheckCircle, Circle, Loader2, XCircle, FileText, Search, FlaskConical, Cpu, BarChart3, Sparkles } from "lucide-react";

type StepStatus = "pending" | "running" | "done" | "error";

interface Step {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  status: StepStatus;
  durationMs: number;
}

const STEPS: Step[] = [
  { id: "validate",  label: "Validación del PDF",        description: "Verificando formato, tamaño y contenido extraíble",       icon: <FileText className="w-4 h-4" />,      status: "pending", durationMs: 1200 },
  { id: "extract",   label: "Extracción de texto",        description: "pdfplumber + pymupdf · texto visible, oculto y metadata", icon: <Search className="w-4 h-4" />,        status: "pending", durationMs: 2000 },
  { id: "segment",   label: "Segmentación de secciones",  description: "Detectando abstract, intro, metodología, resultados…",   icon: <FlaskConical className="w-4 h-4" />,  status: "pending", durationMs: 1000 },
  { id: "audit",     label: "Auditoría (5 checks)",       description: "IA · Inyección · Citas · Patrones · Respaldo — en paralelo", icon: <Cpu className="w-4 h-4" />,       status: "pending", durationMs: 4000 },
  { id: "score",     label: "Consolidación del score",    description: "Calculando score global ponderado y veredicto final",     icon: <BarChart3 className="w-4 h-4" />,     status: "pending", durationMs: 1000 },
  { id: "report",    label: "Generación del reporte",     description: "Armando reporte para investigador y revisor",             icon: <Sparkles className="w-4 h-4" />,      status: "pending", durationMs: 1500 },
];

export default function StatusPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [steps, setSteps] = useState<Step[]>(STEPS);
  const [currentIdx, setCurrentIdx] = useState(0);

  const allDone = steps.every((s) => s.status === "done");
  const doneCount = steps.filter((s) => s.status === "done").length;
  const progress = Math.round((doneCount / steps.length) * 100);

  useEffect(() => {
    if (currentIdx >= steps.length) return;

    setSteps((prev) =>
      prev.map((s, i) => (i === currentIdx ? { ...s, status: "running" } : s))
    );

    const timer = setTimeout(() => {
      setSteps((prev) =>
        prev.map((s, i) => (i === currentIdx ? { ...s, status: "done" } : s))
      );
      setCurrentIdx((i) => i + 1);
    }, steps[currentIdx].durationMs);

    return () => clearTimeout(timer);
  }, [currentIdx]);

  return (
    <div className="max-w-xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-mono text-gray-400 mb-1">ID: {id}</p>
        <h1 className="text-2xl font-bold text-gray-900">
          {allDone ? "Análisis completado" : "Analizando tu paper…"}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {allDone
            ? "El reporte está listo. Podés verlo ahora."
            : "Podés cerrar esta pestaña y volver más tarde con el mismo link."}
        </p>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-gray-500 mb-1.5">
          <span>{doneCount} de {steps.length} pasos completados</span>
          <span className="font-semibold">{progress}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand rounded-full transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-2 mb-8">
        {steps.map((step) => <StepRow key={step.id} step={step} />)}
      </div>

      {/* CTA */}
      {allDone && (
        <div className="p-5 bg-green-50 border border-green-200 rounded-2xl text-center">
          <p className="text-sm font-semibold text-green-800 mb-3">
            ¡El análisis está listo!
          </p>
          <button
            onClick={() => navigate(`/report/${id}`)}
            className="px-6 py-2.5 bg-brand text-white text-sm font-semibold rounded-xl hover:bg-brand-dark transition-colors"
          >
            Ver reporte completo →
          </button>
        </div>
      )}
    </div>
  );
}

function StepRow({ step }: { step: Step }) {
  const STATUS = {
    pending: { icon: <Circle className="w-5 h-5 text-gray-200" />,                         bg: "bg-white",       border: "border-gray-100", label: null },
    running: { icon: <Loader2 className="w-5 h-5 text-brand animate-spin" />,              bg: "bg-brand/5",     border: "border-brand/20", label: <span className="text-xs text-brand font-medium animate-pulse">En proceso</span> },
    done:    { icon: <CheckCircle className="w-5 h-5 text-green-500" />,                   bg: "bg-white",       border: "border-gray-100", label: <span className="text-xs text-green-600 font-medium">Listo</span> },
    error:   { icon: <XCircle className="w-5 h-5 text-red-400" />,                         bg: "bg-red-50",      border: "border-red-200",  label: <span className="text-xs text-red-500 font-medium">Error</span> },
  }[step.status];

  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 ${STATUS.bg} ${STATUS.border}`}>
      <div className="flex-shrink-0">{STATUS.icon}</div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${step.status === "pending" ? "text-gray-400" : "text-gray-800"}`}>
          {step.label}
        </p>
        {step.status !== "pending" && (
          <p className="text-xs text-gray-400 mt-0.5 truncate">{step.description}</p>
        )}
      </div>
      <div className="flex-shrink-0">{STATUS.label}</div>
    </div>
  );
}
