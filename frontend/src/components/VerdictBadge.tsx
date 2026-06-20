import { CheckCircle, AlertCircle, XCircle } from "lucide-react";
import type { Verdict } from "../types";

const CONFIG = {
  Aprobado: {
    icon: <CheckCircle className="w-6 h-6 text-green-500" />,
    bg: "bg-gradient-to-br from-green-50 to-emerald-50",
    border: "border-green-200",
    text: "text-green-900",
    subtitle: "text-green-700",
    badge: "bg-green-100 text-green-700",
    desc: "El paper superó todos los controles sin observaciones significativas.",
  },
  "Revisión manual": {
    icon: <AlertCircle className="w-6 h-6 text-amber-500" />,
    bg: "bg-gradient-to-br from-amber-50 to-yellow-50",
    border: "border-amber-200",
    text: "text-amber-900",
    subtitle: "text-amber-700",
    badge: "bg-amber-100 text-amber-700",
    desc: "Se detectaron señales de riesgo. Se recomienda revisión humana antes de aceptar.",
  },
  Rechazado: {
    icon: <XCircle className="w-6 h-6 text-red-500" />,
    bg: "bg-gradient-to-br from-red-50 to-rose-50",
    border: "border-red-200",
    text: "text-red-900",
    subtitle: "text-red-700",
    badge: "bg-red-100 text-red-700",
    desc: "El paper no cumple criterios mínimos de calidad editorial.",
  },
};

export default function VerdictBadge({ verdict }: { verdict: Verdict }) {
  const c = CONFIG[verdict];
  return (
    <div className={`rounded-2xl border-2 p-6 flex flex-col gap-3 ${c.bg} ${c.border} shadow-lg hover:shadow-xl transition-shadow`}>
      <div className={`flex items-center gap-3 font-bold text-xl ${c.text}`}>
        {c.icon}
        <span>{verdict}</span>
      </div>
      <p className={`text-sm leading-relaxed font-medium ${c.subtitle}`}>{c.desc}</p>
    </div>
  );
}
