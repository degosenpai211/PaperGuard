import { useState } from "react";
import { Eye, EyeOff, AlertTriangle, HeadphonesIcon } from "lucide-react";

export default function SettingsPage() {
  const [showKey, setShowKey] = useState(false);
  const [apiKey, setApiKey] = useState("sk-ant-api03-xxxxxxxxxxxxxxxxxxxx");
  const [region, setRegion] = useState("US East (Virginia)");
  const [pdfEngine, setPdfEngine] = useState("pymupdf");
  const [ocrFallback, setOcrFallback] = useState(true);
  const [detectionLang, setDetectionLang] = useState("english");
  const [autoTranslation, setAutoTranslation] = useState("Disabled");
  const [multilingualEntities, setMultilingualEntities] = useState(true);
  const [ignoreLigatures, setIgnoreLigatures] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 1200));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-on-surface">Configuration</h1>
        <p className="text-sm text-on-surface-variant mt-1">
          Administrá tu entorno técnico, integración con modelos IA y preferencias de parsing de documentos.
        </p>
      </div>

      {/* Section 1: AI Engine & Model Setup */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 space-y-5">
        <h2 className="text-sm font-bold text-on-surface">AI Engine & Model Setup</h2>
        <div className="grid grid-cols-2 gap-5">
          {/* API Key */}
          <div>
            <label className="text-xs font-semibold text-on-surface-variant block mb-1.5">Claude Sonnet API Key</label>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-3 py-2 pr-10 bg-surface-container border border-outline-variant rounded-lg text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          {/* Region */}
          <div>
            <label className="text-xs font-semibold text-on-surface-variant block mb-1.5">Inference Region</label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full px-3 py-2 bg-surface-container border border-outline-variant rounded-lg text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option>US East (Virginia)</option>
              <option>EU West (Dublin)</option>
              <option>Asia Pacific (Tokyo)</option>
            </select>
          </div>
        </div>
        {/* Info banner */}
        <div className="flex items-start gap-2 bg-secondary-container border border-primary/20 rounded-lg p-3">
          <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-white text-xs font-bold leading-none">i</span>
          </div>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Tu API key es encriptada en reposo usando AES-256 GCM. Nunca almacenamos claves en raw en nuestros logs.
          </p>
        </div>
      </div>

      {/* Section 2: PDF Extraction Engine */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-bold text-on-surface">PDF Extraction Engine</h2>
        <div className="grid grid-cols-2 gap-4">
          {/* PyMuPDF */}
          <button
            onClick={() => setPdfEngine("pymupdf")}
            className={`text-left p-4 rounded-xl border-2 transition-all ${
              pdfEngine === "pymupdf"
                ? "border-primary bg-secondary-container/30"
                : "border-outline-variant hover:border-primary/30"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${pdfEngine === "pymupdf" ? "bg-primary text-white" : "bg-surface-container text-on-surface-variant"}`}>
                ⚡
              </div>
              <p className="text-sm font-bold text-on-surface">PyMuPDF (High Performance)</p>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Motor de parsing más rápido. Ideal para descubrimiento legal de alto volumen y documentos estructurados.
            </p>
          </button>
          {/* pdfplumber */}
          <button
            onClick={() => setPdfEngine("pdfplumber")}
            className={`text-left p-4 rounded-xl border-2 transition-all ${
              pdfEngine === "pdfplumber"
                ? "border-primary bg-secondary-container/30"
                : "border-outline-variant hover:border-primary/30"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${pdfEngine === "pdfplumber" ? "bg-primary text-white" : "bg-surface-container text-on-surface-variant"}`}>
                🔬
              </div>
              <p className="text-sm font-bold text-on-surface">pdfplumber (High Precision)</p>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Extracción mejorada de tablas y texto preciso. Recomendado para reportes financieros.
            </p>
          </button>
        </div>
        {/* OCR toggle */}
        <div className="flex items-center justify-between py-3 border-t border-outline-variant">
          <div>
            <p className="text-sm font-semibold text-on-surface">OCR Fallback</p>
            <p className="text-xs text-on-surface-variant mt-0.5">Activa OCR automáticamente para imágenes escaneadas dentro de PDFs.</p>
          </div>
          <button
            onClick={() => setOcrFallback(!ocrFallback)}
            className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${ocrFallback ? "bg-primary" : "bg-outline-variant"}`}
          >
            <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${ocrFallback ? "left-5" : "left-0.5"}`} />
          </button>
        </div>
      </div>

      {/* Section 3: Language Processing */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-bold text-on-surface">Language Processing</h2>
        <div className="grid grid-cols-2 gap-5">
          <div>
            <label className="text-xs font-semibold text-on-surface-variant block mb-2">Detection Priority</label>
            <div className="flex gap-2">
              {[
                { id: "english", label: "English (Primary)" },
                { id: "spanish", label: "Spanish" },
              ].map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setDetectionLang(id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                    detectionLang === id
                      ? "bg-secondary-container text-primary border-primary/20"
                      : "bg-surface-container text-on-surface-variant border-outline-variant hover:border-primary/30"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-on-surface-variant block mb-2">Auto-Translation</label>
            <select
              value={autoTranslation}
              onChange={(e) => setAutoTranslation(e.target.value)}
              className="w-full px-3 py-2 bg-surface-container border border-outline-variant rounded-lg text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option>Disabled</option>
              <option>Spanish to English</option>
              <option>English to Spanish</option>
              <option>Dynamic (Based on UI Lang)</option>
            </select>
          </div>
        </div>
        <div className="border-t border-outline-variant pt-4 space-y-3">
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Advanced Language Settings</p>
          {[
            { label: "Enable multilingual entity recognition", value: multilingualEntities, set: setMultilingualEntities },
            { label: "Ignore non-standard ligatures",         value: ignoreLigatures,       set: setIgnoreLigatures },
          ].map(({ label, value, set }) => (
            <label key={label} className="flex items-center gap-3 cursor-pointer group">
              <div
                onClick={() => set(!value)}
                className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                  value ? "bg-primary border-primary" : "border-outline-variant group-hover:border-primary/50"
                }`}
              >
                {value && <div className="w-2 h-2 bg-white rounded-sm" />}
              </div>
              <span className="text-sm text-on-surface">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-error-container/30 border border-error/20 rounded-xl p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-sm font-bold text-error flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Purge Environment Data
            </h2>
            <p className="text-xs text-on-surface-variant mt-1">
              Eliminá todos los cachés de extracción temporales y la metadata de indexación.
            </p>
          </div>
          <button
            onClick={() => { if (confirm("¿Confirmar limpieza de caché?")) alert("Caché limpiado correctamente."); }}
            className="px-4 py-2 border border-error text-error text-sm font-bold rounded-lg hover:bg-error hover:text-white transition-all"
          >
            Clear Cache
          </button>
        </div>
      </div>

      {/* Form actions */}
      <div className="flex items-center justify-between border-t border-outline-variant pt-4">
        <div className="flex items-center gap-2 text-xs text-on-surface-variant">
          <HeadphonesIcon className="w-4 h-4" />
          <span>¿Necesitás ayuda técnica?</span>
          <button className="text-primary font-bold hover:underline">Contact Enterprise Support</button>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-sm text-on-surface-variant hover:text-on-surface transition-colors"
          >
            Reset Changes
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:opacity-90 transition-all disabled:opacity-70 min-w-[140px]"
          >
            {saved ? "✓ Settings Saved" : saving ? "Saving…" : "Save Configuration"}
          </button>
        </div>
      </div>
    </div>
  );
}
