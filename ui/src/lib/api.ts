export const API_BASE = import.meta.env.VITE_API_BASE as string;

export class ApiError extends Error {
  status: number; detail?: unknown;
  constructor(message: string, status: number, detail?: unknown) { super(message); this.status = status; this.detail = detail; }
}

export async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!r.ok) {
    let detail: any;
    try { detail = await r.json(); } catch {}
    const msg = detail?.error?.message || `${r.status} ${r.statusText}`;
    throw new ApiError(msg, r.status, detail);
  }
  return r.json();
}

export const qs = (params: Record<string, any>) =>
  "?" + new URLSearchParams(Object.fromEntries(
    Object.entries(params).filter(([,v]) => v !== undefined && v !== null && v !== "")
  ) as any).toString();
