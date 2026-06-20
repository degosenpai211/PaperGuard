import type { AuditResult } from "./types";

const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export async function submitAudit(file: File): Promise<{ audit_id: string }> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BASE}/api/audit`, { method: "POST", body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? "Error al enviar el paper");
  }
  return res.json();
}

export async function getAuditStatus(id: string): Promise<{ status: string; progress: number }> {
  const res = await fetch(`${BASE}/api/audit/${id}/status`);
  if (!res.ok) throw new Error("Error al obtener estado");
  return res.json();
}

export async function getAuditResult(id: string): Promise<AuditResult> {
  const res = await fetch(`${BASE}/api/audit/${id}/result`);
  if (!res.ok) throw new Error("Error al obtener resultado");
  return res.json();
}
