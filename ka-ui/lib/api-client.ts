// Minimal, fetch-with-ETag client to hydrate components.
// Works in client components; for server, swap to Route Handlers if needed.

type CacheEntry = { etag?: string; data: any; ts: number }
const memCache = new Map<string, CacheEntry>()

function cacheKey(url: string, params?: Record<string, any>) {
  const p = params ? JSON.stringify(params, Object.keys(params).sort()) : ""
  return `${url}::${p}`
}

export async function fetchJSON<T>(url: string, params?: Record<string, any>, init?: RequestInit): Promise<T> {
  const key = cacheKey(url, params)
  const entry = memCache.get(key)
  const qs = params ? "?" + new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString() : ""
  const headers: HeadersInit = { "Accept": "application/json" }
  if (entry?.etag) headers["If-None-Match"] = entry.etag

  const res = await fetch(url + qs, { ...init, headers, cache: "no-store" })
  if (res.status === 304 && entry) return entry.data as T

  if (!res.ok) {
    let errText = await res.text().catch(() => "")
    try {
      const maybe = JSON.parse(errText)
      errText = maybe?.error?.message || errText
    } catch {}
    throw new Error(errText || `HTTP ${res.status}`)
  }
  const etag = res.headers.get("ETag") || undefined
  const data = (await res.json()) as T
  memCache.set(key, { etag, data, ts: Date.now() })
  return data
}

// Convenience typed wrappers (adapt endpoints as needed)
export const api = {
  symbols: () => fetchJSON("/api/v1/symbols"),
  grahas: (chart_id: string) => fetchJSON("/api/v1/grahas", { chart_id }),
  rashi: (chart_id: string) => fetchJSON("/api/v1/charts/rashi", { chart_id }),
  dasha: (chart_id: string) => fetchJSON("/api/v1/dasha", { chart_id }),
  panchanga: (params: { tz: string; lat?: number; lon?: number; chart_id?: string }) =>
    fetchJSON("/api/v1/panchanga", params as any),
  aspects: (chart_id: string) => fetchJSON("/api/v1/aspects", { chart_id }),
  varshaDetails: (chart_id: string, varsha_year?: number) =>
    fetchJSON("/api/v1/varsha/details", { chart_id, varsha_year }),
}
