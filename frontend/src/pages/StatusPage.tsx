import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CheckCircle2, Circle, Loader2, XCircle, FileText, Search, FlaskConical, Cpu, BarChart3, Sparkles } from "lucide-react";
import { saveAnalysis, getAnalysis } from "../store";

type StepStatus = "pending" | "running" | "done" | "error";
interface Step { id: string; label: string; description: string; icon: React.ReactNode; status: StepStatus; durationMs: number; }

const STEPS: Step[] = [
  { id: "validate", label: "Validación del PDF",       description: "Verificando formato, tamaño y contenido extraíble",          icon: <FileText className="w-4 h-4" />,     status: "pending", durationMs: 1200 },
  { id: "extract",  label: "Extracción de texto",      description: "pdfplumber + pymupdf · texto visible, oculto y metadata",   icon: <Search className="w-4 h-4" />,       status: "pending", durationMs: 2000 },
  { id: "segment",  label: "Segmentación de secciones",description: "Detectando abstract, intro, metodología, resultados…",      icon: <FlaskConical className="w-4 h-4" />, status: "pending", durationMs: 1000 },
  { id: "audit",    label: "Auditoría (5 checks)",     description: "IA · Inyección · Citas · Patrones · Respaldo — en paralelo", icon: <Cpu className="w-4 h-4" />,          status: "pending", durationMs: 4000 },
  { id: "score",    label: "Consolidación del score",  description: "Calculando score global ponderado y veredicto final",        icon: <BarChart3 className="w-4 h-4" />,    status: "pending", durationMs: 1000 },
  { id: "report",   label: "Generación del reporte",   description: "Armando reporte para investigador y revisor",                icon: <Sparkles className="w-4 h-4" />,     status: "pending", durationMs: 1500 },
];

export default function StatusPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [steps, setSteps] = useState<Step[]>(STEPS);
  const [currentIdx, setCurrentIdx] = useState(0);

  const analysis = id ? getAnalysis(id) : undefined;
  const allDone = steps.every((s) => s.status === "done");
  const doneCount = steps.filter((s) => s.status === "done").length;
  const progress = Math.round((doneCount / steps.length) * 100);

  useEffect(() => {
    if (currentIdx >= steps.length) return;
    setSteps((prev) => prev.map((s, i) => (i === currentIdx ? { ...s, status: "running" } : s)));
    const timer = setTimeout(() => {
      setSteps((prev) => prev.map((s, i) => (i === currentIdx ? { ...s, status: "done" } : s)));
      setCurrentIdx((i) => i + 1);
    }, steps[currentIdx].durationMs);
    return () => clearTimeout(timer);
  }, [currentIdx]);

  useEffect(() => {
    if (allDone && id) {
      const score = Math.floor(Math.random() * 35) + 60; // 60-95
      const status = score >= 80 ? "completed" : "flagged";
      const existing = getAnalysis(id);
      if (existing) {
        saveAnalysis({ ...existing, score, status });
      }
    }
  }, [allDone, id]);

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <p className="text-xs font-mono text-on-surface-variant bg-surface-container px-2 py-1 rounded inline-block mb-2">ID: {id}</p>
          {analysis && (
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-primary" />
              <p className="text-sm font-semibold text-on-surface truncate">{analysis.name}</p>
              <span className="text-xs text-on-surface-variant">· {analysis.size}</span>
            </div>
          )}
          <h1 className="text-2xl font-bold text-on-surface">
            {allDone ? "Análisis completado" : "Analizando tu paper…"}
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            {allDone ? "El reporte está listo. Podés verlo ahora." : "El proceso puede demorar entre 2 y 5 minutos."}
          </p>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5">
          <div className="flex justify-between text-xs text-on-surface-variant mb-2">
            <span>{doneCount} de {steps.length} pasos completados</span>
            <span className="font-bold text-primary">{progress}%</span>
          </div>
          <div className="h-2 bg-surface-container rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="space-y-2">
          {steps.map((step) => <StepRow key={step.id} step={step} />)}
        </div>

        {allDone && (
          <div className="p-5 bg-secondary-container border border-primary/20 rounded-xl text-center">
            <p className="text-sm font-semibold text-on-surface mb-3">¡El análisis está listo!</p>
            <button onClick={() => navigate(`/report/${id}`)}
              className="px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-lg hover:opacity-90 transition-opacity">
              Ver reporte completo →
            </button>
          </div>
        )}

        {!allDone && (
          <div className="text-center">
            <button onClick={() => navigate("/")}
              className="text-sm text-on-surface-variant hover:text-on-surface transition-colors underline">
              Cancelar y volver al inicio
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function StepRow({ step }: { step: Step }) {
  const cfg = {
    pending: { icon: <Circle className="w-5 h-5 text-outline-variant" />,         bg: "bg-surface-container-lowest", border: "border-outline-variant",  label: null },
    running: { icon: <Loader2 className="w-5 h-5 text-primary animate-spin" />,   bg: "bg-secondary-container/40",   border: "border-primary/30",       label: <span className="text-xs text-primary font-medium animate-pulse">En proceso</span> },
    done:    { icon: <CheckCircle2 className="w-5 h-5 text-tertiary-container" />, bg: "bg-surface-container-lowest", border: "border-outline-variant",   label: <span className="text-xs text-tertiary-container font-medium">Listo</span> },
    error:   { icon: <XCircle className="w-5 h-5 text-error" />,                   bg: "bg-error-container",          border: "border-error/20",          label: <span className="text-xs text-error font-medium">Error</span> },
  }[step.status];

  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 ${cfg.bg} ${cfg.border}`}>
      <div className="flex-shrink-0">{cfg.icon}</div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${step.status === "pending" ? "text-on-surface-variant" : "text-on-surface"}`}>{step.label}</p>
        {step.status !== "pending" && <p className="text-xs text-on-surface-variant mt-0.5 truncate">{step.description}</p>}
      </div>
      <div className="flex-shrink-0">{cfg.label}</div>
    </div>
  );
}
