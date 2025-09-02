// lib/api-client.ts

// Configurable base URL. If unset, calls go to same-origin (e.g., /api/...).
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? ""

// Safer query param typing (no `any`)
type Primitive = string | number | boolean
type QueryParams = Record<string, Primitive | null | undefined>

type CacheEntry = { etag?: string; data: unknown; ts: number }
const memCache = new Map<string, CacheEntry>()

function cacheKey(path: string, params?: QueryParams) {
  const p = params ? JSON.stringify(params, Object.keys(params).sort()) : ""
  return `${path}::${p}`
}

function buildQuery(params?: QueryParams): string {
  if (!params) return ""
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null
  ) as [string, Primitive][]
  return entries.length
    ? "?" + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString()
    : ""
}

/**
 * fetchJSON - ETag-aware GET with typed return and no `any`.
 * `path` should be a relative path like "/api/v1/grahas"
 */
export async function fetchJSON<T>(
  path: string,
  params?: QueryParams,
  init?: RequestInit
): Promise<T> {
  const key = cacheKey(path, params)
  const entry = memCache.get(key)
  const qs = buildQuery(params)
  const url = API_BASE + path + qs

  if (process.env.NODE_ENV !== "production") {
    // remove after debugging
    // eslint-disable-next-line no-console
    console.debug("[API]", url)
  }

  const headers: HeadersInit = { Accept: "application/json" }
  if (entry?.etag) headers["If-None-Match"] = entry.etag

  const res = await fetch(url, { ...init, headers, cache: "no-store" })

  if (res.status === 304 && entry) {
    return entry.data as T
  }

  if (!res.ok) {
    let msg: string = await res.text().catch(() => "")
    try {
      const maybe = JSON.parse(msg) as { error?: { message?: string } }
      msg = maybe?.error?.message || msg
    } catch {
      // keep raw msg
    }
    throw new Error(msg || `HTTP ${res.status}`)
  }

  const etag = res.headers.get("ETag") || undefined
  const data = (await res.json()) as unknown as T
  memCache.set(key, { etag, data, ts: Date.now() })
  return data
}

// Convenience typed wrappers (adapt endpoint paths as needed)
export const api = {
  symbols: () => fetchJSON("/api/v1/symbols"),
  grahas: (chart_id: string) => fetchJSON("/api/v1/grahas", { chart_id }),
  rashi: (chart_id: string) => fetchJSON("/api/v1/charts/rashi", { chart_id }),
  dasha: (chart_id: string) => fetchJSON("/api/v1/dasha", { chart_id }),
  panchanga: (params: { tz: string; lat?: number; lon?: number; chart_id?: string }) =>
    fetchJSON("/api/v1/panchanga", params as Record<string, Primitive | null | undefined>),
  aspects: (chart_id: string) => fetchJSON("/api/v1/aspects", { chart_id }),
  varshaDetails: (chart_id: string, varsha_year?: number) =>
    fetchJSON("/api/v1/varsha/details", { chart_id, varsha_year }),
}

// ========== ACG Cities ==========

export type ACGCityHit = {
  planet: string
  angle: string
  distance_km: number
  advice: string | null
}

export type ACGCityRow = {
  chart_id?: string
  key: string
  name: string
  country: string
  lat: number
  lon: number
  planet?: string | null
  angle?: string | null
  distance_km?: number | null
  advice?: string | null
}

/**
 * Fetch astrocartography cities from backend and flatten hits into table rows.
 */
export async function fetchAcgCities(params: {
  dob?: string
  tob?: string
  tz?: string
  lat?: number
  lon?: number
}): Promise<ACGCityRow[]> {
  const base = await fetchJSON<{
    chart_id?: string
    cities: Array<{
      key: string
      name: string
      country: string
      lat: number
      lon: number
      hits: ACGCityHit[]
    }>
  }>("/api/v1/acg/cities", params as any)

  const rows: ACGCityRow[] = []
  for (const c of base.cities ?? []) {
    if (!c.hits || c.hits.length === 0) {
      rows.push({
        chart_id: base.chart_id,
        key: c.key,
        name: c.name,
        country: c.country,
        lat: c.lat,
        lon: c.lon,
        planet: null,
        angle: null,
        distance_km: null,
        advice: null,
      })
    } else {
      for (const h of c.hits) {
        rows.push({
          chart_id: base.chart_id,
          key: c.key,
          name: c.name,
          country: c.country,
          lat: c.lat,
          lon: c.lon,
          planet: h.planet,
          angle: h.angle,
          distance_km: h.distance_km,
          advice: h.advice,
        })
      }
    }
  }
  return rows
}

