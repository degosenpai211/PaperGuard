import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, FileText, X, AlertCircle, RefreshCw, CheckCircle2, Zap, CalendarDays, ShieldCheck, Plus } from "lucide-react";
import { saveAnalysis, setPdfUrl } from "../store";

const STATS = [
  { icon: CheckCircle2, label: "FEATURES ACTIVAS", value: "12 / 18", bg: "bg-secondary-container",    iconColor: "text-primary" },
  { icon: Zap,          label: "UPTIME",            value: "99.8%",  bg: "bg-tertiary-container/20", iconColor: "text-tertiary-container" },
  { icon: ShieldCheck,  label: "COMPLIANCE",        value: "SOC2",   bg: "bg-error-container",        iconColor: "text-error" },
  { icon: CalendarDays, label: "PRÓXIMO HITO",      value: "Q3 2025",bg: "bg-primary-container/20",   iconColor: "text-primary" },
];

type CardStatus = "deployed" | "in-progress" | "backlog" | "target";
interface RoadmapCard { title: string; tag: string; status: CardStatus; desc: string; footer: string; accent?: boolean; }

const ROADMAP: { col: string; priority: string; priorityColor: string; cards: RoadmapCard[] }[] = [
  {
    col: "Núcleo — Esencial", priority: "P1 PRIORIDAD", priorityColor: "bg-primary text-white",
    cards: [
      { title: "Extracción de texto PDF", tag: "PYMUPDF",       status: "deployed",     desc: "Extracción estructural de texto, metadata y vectores.", footer: "Engine Module 1.0" },
      { title: "Sanitización de entrada", tag: "REGEXP / CLEAN",status: "deployed",     desc: "Filtrado de caracteres invisibles e inyecciones.",       footer: "Security Core" },
      { title: "Detector IA de texto",    tag: "CLAUDE SONNET", status: "in-progress",  desc: "Análisis probabilístico de texto generado por LLMs.",    footer: "Intelligence Layer", accent: true },
    ],
  },
  {
    col: "Debería — Calidad", priority: "P2 PRIORIDAD", priorityColor: "bg-secondary-container text-primary",
    cards: [
      { title: "Segmentación de secciones", tag: "LAYOUTLM V3",   status: "in-progress", desc: "División semántica en capítulos para análisis orientado.", footer: "Pre-processing", accent: true },
      { title: "Detección de inyección",    tag: "BERT-FORENSIC",  status: "backlog",     desc: "Detección de caracteres invisibles y capas ocultas.",     footer: "Security Core" },
      { title: "Score de confianza",        tag: "SOFTMAX",        status: "in-progress", desc: "Puntuación global ponderada y veredicto editorial.",       footer: "Reporting", accent: true },
    ],
  },
  {
    col: "Sería bueno", priority: "P3 PRIORIDAD", priorityColor: "bg-surface-container-high text-on-surface-variant",
    cards: [
      { title: "Perplexity Scoring", tag: "GPT-4O EVAL",  status: "target", desc: "Puntuación de outliers en texto generado.", footer: "Research Dept" },
      { title: "Exportación PDF",    tag: "REACT-PDF",    status: "target", desc: "Certificados de auditoría profesionales.",  footer: "Reporting" },
      { title: "Soporte bilingüe",   tag: "NLTK / SPACY", status: "target", desc: "Análisis en español e inglés.",             footer: "Global Expansion" },
    ],
  },
];

const STATUS_CFG: Record<CardStatus, { label: string; icon: React.ReactNode; color: string }> = {
  "deployed":    { label: "DEPLOYED",    icon: <CheckCircle2 className="w-3.5 h-3.5" />,            color: "text-tertiary-container" },
  "in-progress": { label: "IN PROGRESS", icon: <RefreshCw className="w-3.5 h-3.5 animate-spin" />,  color: "text-primary" },
  "backlog":     { label: "BACKLOG",     icon: <span className="w-3.5 h-3.5 inline-block">○</span>,  color: "text-on-surface-variant" },
  "target":      { label: "Q4 TARGET",   icon: <CalendarDays className="w-3.5 h-3.5" />,             color: "text-on-surface-variant" },
};

export default function UploadPage() {
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
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Product Roadmap</h1>
          <p className="text-sm text-on-surface-variant mt-1">Despliegue estratégico de módulos de verificación de documentos e IA.</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Progreso global</p>
          <p className="text-2xl font-bold text-primary">64% Completo</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {STATS.map(({ icon: Icon, label, value, bg, iconColor }) => (
          <div key={label} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-5 h-5 ${iconColor}`} />
            </div>
            <div>
              <p className="text-xs text-on-surface-variant font-medium uppercase tracking-wider">{label}</p>
              <p className="text-lg font-bold text-on-surface leading-tight">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Upload Banner */}
      <div className="bg-secondary-container border border-primary/20 rounded-xl p-4 flex items-center gap-4">
        <div className="flex-1">
          <p className="text-sm font-bold text-on-surface">Iniciar nuevo análisis</p>
          <p className="text-xs text-on-surface-variant mt-0.5">Subí tu manuscrito PDF para auditarlo con IA avanzada</p>
        </div>
        {!file ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed cursor-pointer transition-all text-sm font-medium ${
              dragging ? "border-primary bg-primary/10 text-primary" : "border-outline-variant text-on-surface-variant hover:border-primary/50 hover:text-primary"
            }`}
          >
            <Upload className="w-4 h-4" />
            {dragging ? "Suelta aquí" : "Subir PDF"}
            <input ref={inputRef} type="file" accept="application/pdf" className="hidden"
              onChange={(e: ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) validateAndSet(f); }} />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-lowest border border-outline-variant rounded-lg">
              <FileText className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium text-on-surface max-w-[120px] truncate">{file.name}</span>
              <button onClick={() => setFile(null)} className="text-on-surface-variant hover:text-error transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <button onClick={handleSubmit} disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60">
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> Analizar</>}
            </button>
          </div>
        )}
        {fileError && <p className="text-xs text-error flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{fileError}</p>}
      </div>

      {/* Kanban */}
      <div className="grid grid-cols-3 gap-4">
        {ROADMAP.map(({ col, priority, priorityColor, cards }) => (
          <div key={col} className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-on-surface">{col}</h3>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${priorityColor}`}>{priority}</span>
            </div>
            {cards.map((card) => {
              const st = STATUS_CFG[card.status];
              return (
                <div key={card.title} className={`bg-surface-container-lowest border rounded-xl p-4 transition-all hover:shadow-md ${
                  card.accent ? "border-primary/30 border-l-4 border-l-primary" : "border-outline-variant"
                } ${card.status === "target" ? "opacity-60 grayscale hover:opacity-100 hover:grayscale-0" : ""}`}>
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-on-surface-variant bg-surface-container px-1.5 py-0.5 rounded">{card.tag}</span>
                    <div className={`flex items-center gap-1 text-xs font-bold ${st.color}`}>{st.icon}<span>{st.label}</span></div>
                  </div>
                  <h4 className="text-sm font-bold text-on-surface mb-1">{card.title}</h4>
                  <p className="text-xs text-on-surface-variant leading-relaxed mb-3">{card.desc}</p>
                  <div className="border-t border-outline-variant pt-2">
                    <span className="text-xs text-on-surface-variant">{card.footer}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-xs text-on-surface-variant border-t border-outline-variant pt-4">
        <span>System Version: v2.4.0-stable</span>
        <div className="flex gap-4">
          <button className="hover:text-primary transition-colors">Documentación</button>
          <button className="hover:text-primary transition-colors">API Status</button>
        </div>
      </div>
    </div>
  );
}
