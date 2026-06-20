// In-memory map: analysis id → object URL for the uploaded PDF blob.
// Survives navigation within the same session but clears on page refresh.
const pdfUrlMap = new Map<string, string>();

export function setPdfUrl(id: string, file: File) {
  // Revoke any previous URL for this id to avoid memory leaks
  const prev = pdfUrlMap.get(id);
  if (prev) URL.revokeObjectURL(prev);
  pdfUrlMap.set(id, URL.createObjectURL(file));
}

export function getPdfUrl(id: string): string | null {
  return pdfUrlMap.get(id) ?? null;
}

export interface Analysis {
  id: string;
  name: string;
  size: string;
  date: string;
  time: string;
  score: number;
  status: "processing" | "completed" | "flagged";
}

const KEY = "paperguard_analyses";

export function getAnalyses(): Analysis[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveAnalysis(a: Analysis) {
  const list = getAnalyses();
  const idx = list.findIndex((x) => x.id === a.id);
  if (idx >= 0) list[idx] = a;
  else list.unshift(a);
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function getAnalysis(id: string): Analysis | undefined {
  return getAnalyses().find((a) => a.id === id);
}
