"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Page, PageHeader, SectionCard } from "@/components/layout/page-scaffold"
import { useChartMeta } from "@/components/providers/chart-provider"
import { api, fetchJSON } from "@/lib/api-client"
import { PLANET_GLYPHS, getPlanetColor } from "@/lib/acg"

/* =====================
   Types (API shape)
===================== */

type VarshaPlanet = { lon: number; retro: boolean }

type VarshaResponse = {
  chart_id?: string
  varsha: {
    year: number
    moment_local: string
    moment_utc: string
    asc_idx: number
    asc_sidereal: number
    rashi_houses: string[][] // 12 arrays of planet names (Rashi)
    chalit_houses: string[][] // 12 arrays of planet names (Chalit)
    planets: Record<string, VarshaPlanet>
    muntha: {
      age_years: number
      house_in_return: number
      lord: string
      lord_house_in_return: number
      sign: string
      sign_idx: number
    }
  }
  varsha_predictions?: Record<string, string[]>
}

/* =====================
   Helpers
===================== */

const HOUSE_TITLES = [
  "Self", "Income / Family", "Communication", "Home / Roots", "Creativity / Children",
  "Health / Service", "Partnerships", "Transform / Shared", "Dharma / Travel",
  "Career / Status", "Gains / Network", "Solitude / Closure",
]

const PAD = (n: number) => (n < 10 ? `0${n}` : String(n))

function fmtDate(s: string) {
  try {
    const d = new Date(s)
    return `${d.getFullYear()}-${PAD(d.getMonth() + 1)}-${PAD(d.getDate())} ${PAD(d.getHours())}:${PAD(d.getMinutes())}`
  } catch {
    return s
  }
}

function planetChip(name: string) {
  const glyph = PLANET_GLYPHS?.[name] ?? "";
  return (
    <span
      key={name}
      className="inline-flex items-center gap-1 rounded-full border border-border/80 bg-background/60 px-2 py-0.5 text-xs"
      style={{ color: getPlanetColor(name), borderColor: getPlanetColor(name) }}
      title={name}
    >
      <span className="text-sm leading-none">{glyph}</span>
      <span className="font-medium leading-none">{name}</span>
    </span>
  )
}

function degrees(n: number) {
  const deg = ((n % 360) + 360) % 360
  return `${deg.toFixed(2)}°`
}

/* =====================
   Data fetch (chart_id first; else dob/tob/lat/lon)
===================== */

async function getVarsha(meta: any, year?: number): Promise<VarshaResponse | null> {
  // Prefer chart_id-aware endpoint if available
  try {
    if (meta?.chart_id) {
      const res = await api.varshaDetails(meta.chart_id as string, year)
      return res as VarshaResponse
    }
  } catch (e) {
    console.warn("varshaDetails failed; falling back to /api/v1/varsha", e)
  }
  try {
    const params: Record<string, any> = {
      dob: meta?.dob,
      tob: meta?.tob,
      tz: meta?.tz,
      lat: meta?.lat,
      lon: meta?.lon,
    }
    if (year) params.varsha_year = year
    const res = await fetchJSON("/api/v1/varsha", params)
    return res as VarshaResponse
  } catch (e) {
    console.error(e)
    return null
  }
}

/* =====================
   Page
===================== */

export default function VarshaPage() {
  const { meta } = useChartMeta()
  const search = useSearchParams()
  const router = useRouter()

  // Resolve initial year from URL (?year=YYYY) or default to current/next
  const urlYear = Number(search?.get("year"))
  const defaultYear = Number.isFinite(urlYear) && urlYear > 0 ? urlYear : new Date().getFullYear() + 1
  const [year, setYear] = useState<number>(defaultYear)

  const [data, setData] = useState<VarshaResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const paramsKey = useMemo(() => [meta.chart_id, meta.dob, meta.tob, meta.tz, meta.lat, meta.lon, year].join("|"), [meta, year])

  useEffect(() => {
    let cancel = false
    setLoading(true)
    setData(null)
    ;(async () => {
      const res = await getVarsha(meta, year)
      if (!cancel) setData(res)
      if (!cancel) setLoading(false)
    })()
    return () => {
      cancel = true
    }
  }, [paramsKey])

  // Keep URL in sync when year changes (shallow push)
  useEffect(() => {
    const q = new URLSearchParams(Array.from((search as any)?.entries?.() || []))
    q.set("year", String(year))
    router.replace(`/varsha?${q.toString()}`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year])

  const v = data?.varsha
  const preds = data?.varsha_predictions || {}
  const categories = Object.keys(preds)

  return (
    <Page>
      <PageHeader
        title="Varṣaphala (Solar Return)"
        subtitle="Annual themes, houses, and yogas · computed for your return chart"
      />

      {/* Year + Key Facts */}
      <SectionCard>
        <div className="grid gap-4 lg:grid-cols-12">
          <div className="lg:col-span-3 space-y-2">
            <label className="text-xs text-text/70">Year</label>
            <YearSelect year={year} setYear={setYear} />
          </div>

          <div className="lg:col-span-9 grid grid-cols-2 md:grid-cols-4 gap-3">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-muted/20 animate-pulse" />
              ))
            ) : v ? (
              <>
                <Kpi title="Solar Return (UTC)" value={fmtDate(v.moment_utc)} />
                <Kpi title="Solar Return (Local)" value={fmtDate(v.moment_local)} />
                <Kpi title="Ascendant (sign idx)" value={`#${v.asc_idx}`} />
                <Kpi title="Muntha" value={`House ${v.muntha.house_in_return} · ${v.muntha.sign} (${v.muntha.age_years})`} />
              </>
            ) : (
              <div className="col-span-4 p-4 text-sm text-text/70">No data returned by the API.</div>
            )}
          </div>
        </div>
      </SectionCard>

      {/* Houses: Rashi & Chalit side-by-side */}
      <SectionCard>
        <div className="mb-3 text-sm font-medium">Houses</div>
        <div className="grid gap-6 lg:grid-cols-2">
          <HouseGrid title="Rāśi (Whole Sign)" houses={v?.rashi_houses} />
          <HouseGrid title="Bhāva Chalit" houses={v?.chalit_houses} />
        </div>
      </SectionCard>

      {/* Planets table */}
      <SectionCard>
        <div className="mb-3 text-sm font-medium">Planets in Return</div>
        {loading ? (
          <div className="h-24 rounded-xl bg-muted/20 animate-pulse" />
        ) : v ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="py-2 pr-3 font-semibold">Planet</th>
                  <th className="py-2 pr-3 font-semibold">Longitude</th>
                  <th className="py-2 pr-3 font-semibold">Retro</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(v.planets).map(([name, p]) => (
                  <tr key={name} className="border-b border-border/50">
                    <td className="py-2 pr-3">
                      <div className="inline-flex items-center gap-2">
                        <span style={{ color: getPlanetColor(name) }} className="text-base">{PLANET_GLYPHS?.[name] ?? ""}</span>
                        <span className="font-medium">{name}</span>
                      </div>
                    </td>
                    <td className="py-2 pr-3 tabular-nums">{degrees(p.lon)}</td>
                    <td className="py-2 pr-3">{p.retro ? "Yes" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-sm text-text/70">No planet data.</div>
        )}
      </SectionCard>

      {/* Predictions: categories -> cards */}
      <SectionCard>
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-medium">Annual Themes & Yogas</div>
        </div>

        {categories.length === 0 ? (
          <div className="text-sm text-text/70">No interpretations available from API.</div>
        ) : (
          <Tabs defaultValue={categories[0]!} className="w-full">
            <TabsList className="w-full flex flex-wrap gap-1">
              {categories.map((c) => (
                <TabsTrigger key={c} value={c}>{c}</TabsTrigger>
              ))}
            </TabsList>
            {categories.map((c) => (
              <TabsContent key={c} value={c} className="mt-3">
                <div className="grid gap-3 max-h-[48vh] overflow-y-auto pr-1">
                  {(preds[c] || []).map((line, idx) => (
                    <Card key={idx} className="p-3">
                      <p className="text-sm leading-relaxed">{line}</p>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </SectionCard>

      {/* Footer tip */}
      <SectionCard>
        <div className="text-xs text-text/70">
          Tip: Cross‑check return themes with your running daśā and recent transits for timing.
        </div>
      </SectionCard>
    </Page>
  )
}

/* =====================
   UI Partials
===================== */

function Kpi({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface/70 backdrop-blur px-3 py-2">
      <div className="text-[11px] text-text/70">{title}</div>
      <div className="text-sm font-medium mt-0.5">{value}</div>
    </div>
  )
}

function YearSelect({ year, setYear }: { year: number; setYear: (y: number) => void }) {
  const years = Array.from({ length: 9 }).map((_, i) => new Date().getFullYear() - 1 + i) // span around current
  return (
    <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
      <SelectTrigger className="w-40">
        <SelectValue placeholder="Select year" />
      </SelectTrigger>
      <SelectContent>
        {years.map((y) => (
          <SelectItem key={y} value={String(y)}>{y}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function HouseGrid({ title, houses }: { title: string; houses?: string[][] }) {
  return (
    <div>
      <div className="mb-2 text-xs text-text/70">{title}</div>
      {!houses || houses.length !== 12 ? (
        <div className="h-40 rounded-xl bg-muted/20 animate-pulse" />
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {houses.map((planets, idx) => (
            <div key={idx} className="rounded-xl border border-border bg-background/60 p-2">
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-medium">House {idx + 1}</span>
                <span className="text-text/60">{HOUSE_TITLES[idx]}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {planets.length === 0 ? (
                  <span className="text-xs text-text/60">—</span>
                ) : (
                  planets.map((p) => planetChip(p))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
