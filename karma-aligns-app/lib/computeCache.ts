// Tiny sessionStorage cache for /compute responses keyed by the form params.
export type ComputeParams = { dob: string; tob: string; tz: string; lat: string; lon: string };

const PREFIX = "ka:compute:";

export function keyFromParams(p: ComputeParams) {
  return `${p.dob}|${p.tob}|${p.tz}|${p.lat}|${p.lon}`;
}

export function saveCompute(p: ComputeParams, json: any) {
  try {
    if (typeof window === "undefined") return;
    const key = PREFIX + keyFromParams(p);
    sessionStorage.setItem(key, JSON.stringify({ savedAt: Date.now(), json }));
  } catch {}
}

export function loadCompute(p: ComputeParams): any | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = sessionStorage.getItem(PREFIX + keyFromParams(p));
    if (!raw) return null;
    const data = JSON.parse(raw);
    return data?.json ?? null;
  } catch {
    return null;
  }
}

export function clearCompute(p: ComputeParams) {
  try {
    if (typeof window === "undefined") return;
    sessionStorage.removeItem(PREFIX + keyFromParams(p));
  } catch {}
}
