import { CheckCircle, AlertCircle, XCircle } from "lucide-react";
import type { Verdict } from "../types";

const CONFIG = {
  Aprobado: {
    dot: "🟢",
    icon: <CheckCircle className="w-5 h-5 text-green-500" />,
    bg: "bg-green-50",
    border: "border-green-200",
    text: "text-green-800",
    desc: "El paper superó todos los controles sin observaciones significativas.",
  },
  "Revisión manual": {
    dot: "🟡",
    icon: <AlertCircle className="w-5 h-5 text-amber-500" />,
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-800",
    desc: "Se detectaron señales de riesgo. Se recomienda revisión humana antes de aceptar.",
  },
  Rechazado: {
    dot: "🔴",
    icon: <XCircle className="w-5 h-5 text-red-500" />,
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-800",
    desc: "El paper no cumple criterios mínimos de calidad editorial.",
  },
};

export default function VerdictBadge({ verdict }: { verdict: Verdict }) {
  const c = CONFIG[verdict];
  return (
    <div className={`rounded-2xl border p-5 flex flex-col justify-center gap-2 ${c.bg} ${c.border}`}>
      <div className={`flex items-center gap-2 font-bold text-lg ${c.text}`}>
        {c.icon} {c.dot} {verdict}
      </div>
      <p className={`text-sm ${c.text}`}>{c.desc}</p>
    </div>
  );
}
