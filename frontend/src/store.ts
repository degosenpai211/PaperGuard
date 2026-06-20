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
