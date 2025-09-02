"use client"

import { useEffect, useMemo, useState } from "react"
import dynamic from "next/dynamic"
import { fetchJSON } from "@/lib/api-client"
import ACGLegend from "@/components/acg/legend"
import ACGFilterBar, { type AdviceFilter } from "@/components/acg/filter-bar"
import { PLANET_COLORS, LINE_STYLE, type LineType } from "@/lib/acg"
import { Card } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { getPlanetColor, getLineStyle, type LineType } from "@/lib/acg"
import { useChartMeta } from "@/components/providers/chart-provider"
import { Page, PageHeader, SectionCard } from "@/components/layout/page-scaffold"
import CitiesHowTo from "@/components/acg/cities-howto" // reuse the same explainer for consistency

/* Lazy React-Leaflet */
const MapContainer = dynamic(
    async () => (await import("react-leaflet")).MapContainer,
    { ssr: false }
)
const TileLayer = dynamic(() => import("react-leaflet").then(m => m.TileLayer), { ssr: false })
const Polyline = dynamic(() => import("react-leaflet").then(m => m.Polyline), { ssr: false })
const LeafletTooltip = dynamic(() => import("react-leaflet").then(m => m.Tooltip), { ssr: false })

/* ---------- Types & Normalizer ---------- */
type Coord = { lat: number; lon: number }
type Lines = Record<string, Record<LineType, Coord[]>>
type NormalizedAcg = { advice: Record<string, string[]>; lines: Lines }

function toLineType(k: string): LineType | undefined {
    const u = k?.toUpperCase?.()
    return u === "ASC" || u === "MC" || u === "DSC" || u === "IC" ? (u as LineType) : undefined
}
function toCoords(input: unknown): Coord[] {
    if (Array.isArray(input) && input.length && typeof input[0] === "object" && input[0] !== null && "lat" in (input[0] as any)) {
        return (input as any[]).map(c => ({ lat: Number((c as any).lat), lon: Number((c as any).lon) }))
    }
    const g: any = input as any
    if (g?.geometry?.coordinates && Array.isArray(g.geometry.coordinates)) {
        return g.geometry.coordinates.map((p: any) => ({ lat: Number(p[1]), lon: Number(p[0]) }))
    }
    if (Array.isArray(input) && input.length && Array.isArray((input as any[])[0])) {
        return (input as any[]).map(p => ({ lat: Number((p as any[])[0]), lon: Number((p as any[])[1]) }))
    }
    return []
}
function normalizeAcg(raw: any): NormalizedAcg | null {
    if (!raw) return null
    const acg = raw.acg ?? raw
    const advice = (acg.advice ?? {}) as Record<string, string[]>
    const out: Lines = {}
    const srcLines = acg.lines ?? {}

    for (const planet of Object.keys(srcLines)) {
        const byType: Record<LineType, Coord[]> = {} as any
        const typesObj = srcLines[planet] ?? {}

        for (const tKey of Object.keys(typesObj)) {
            const segment = typesObj[tKey]
            const push = (seg: any) => {
                const arr = byType[tKey] ?? []
                byType[tKey] = arr.concat(toCoords(seg))
            }

            if (Array.isArray(segment) && segment.length > 0) {
                const nested = Array.isArray(segment[0]) || (segment[0] && (segment[0] as any).geometry)
                if (nested) {
                    for (const seg of segment) push(seg)
                } else {
                    push(segment)
                }
            }
        }
        out[planet] = byType
    }

    return { advice, lines: out }
}

/* ---------- Page ---------- */
export default function AstrocartographyPage() {
    const { meta, setMeta } = useChartMeta()

    const params = useMemo(
        () => ({
            dob: meta.dob,
            tob: meta.tob,
            tz: meta.tz,
            lat: meta.lat,
            lon: meta.lon,
        }),
        [meta.dob, meta.tob, meta.tz, meta.lat, meta.lon]
    )

    const [data, setData] = useState<NormalizedAcg | null>(null)
    const [loading, setLoading] = useState(true)

    // Filters
    const [activePlanets, setActivePlanets] = useState<string[]>([])
    const [activeTypes, setActiveTypes] = useState<LineType[]>(["ASC", "MC", "DSC", "IC"])
    const [adviceFilter, setAdviceFilter] = useState<AdviceFilter>("all")

    // Tabs (controlled) to avoid “blank panel” when filter changes
    const [activeTheme, setActiveTheme] = useState<string>("")

    useEffect(() => {
        let cancelled = false
        setLoading(true)
        setData(null)

            ; (async () => {
                try {
                    const raw = await fetchJSON<any>("/api/v1/acg", params)
                    if (cancelled) return
                    const norm = normalizeAcg(raw)
                    setData(norm)

                    // Default enabled planets = all from response
                    const planets = Object.keys(norm.lines || {})
                    setActivePlanets(planets)

                    // Merge authoritative echoes
                    if (raw?.chart_id || raw?.echo) {
                        setMeta({
                            chart_id: raw.chart_id ?? meta.chart_id,
                            ayanamsa: raw.echo?.ayanamsa ?? meta.ayanamsa,
                            hsys: raw.echo?.hsys ?? meta.hsys,
                        })
                    }
                } catch (e) {
                    console.error(e)
                    if (!cancelled) setData(null)
                } finally {
                    if (!cancelled) setLoading(false)
                }
            })()

        return () => {
            cancelled = true
        }
    }, [params, meta.id, setMeta])

    // Derived values
    const advice = data?.advice ?? {}
    const lines = data?.lines ?? {}

    const allThemes = useMemo(() => Object.keys(advice), [advice])
    const themeIsPositive = (theme: string) => theme.toLowerCase() !== "caution"

    const visibleThemes = useMemo(() => {
        if (!allThemes.length) return []
        if (adviceFilter === "all") return allThemes
        return allThemes.filter((t) =>
            adviceFilter === "positive" ? themeIsPositive(t) : !themeIsPositive(t)
        )
    }, [allThemes, adviceFilter])

    // Keep selected tab valid whenever themes/filters change
    useEffect(() => {
        if (!allThemes.length) {
            setActiveTheme("")
            return
        }
        if (!visibleThemes.length) {
            setActiveTheme(allThemes[0]!)
            return
        }
        if (!activeTheme || !visibleThemes.includes(activeTheme)) {
            setActiveTheme(visibleThemes[0]!)
        }
    }, [visibleThemes, allThemes, activeTheme])

    if (loading) {
        return (
            <div className="space-y-6">
                <Header />
                <GlassCard><div className="h-28 animate-pulse rounded-xl bg-muted/20" /></GlassCard>
                <GlassCard><div className="h-14 animate-pulse rounded-xl bg-muted/20" /></GlassCard>
                <div className="grid gap-6 lg:grid-cols-12">
                    <GlassCard className="lg:col-span-4"><div className="h-[420px] animate-pulse rounded-xl bg-muted/20" /></GlassCard>
                    <GlassCard className="lg:col-span-8"><div className="h-[66vh] min-h-[520px] animate-pulse rounded-xl bg-muted/20" /></GlassCard>
                </div>
            </div>
        )
    }

    if (!data) {
        return (
            <div className="space-y-6">
                <Header />
                <GlassCard><HowToRead /></GlassCard>
                <GlassCard><div className="p-6 text-sm text-text/70">No data returned by the API for these birth details.</div></GlassCard>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <Header />

            {/* Consistent explainer block (same as Cities page) */}
            <GlassCard>
                <HowToRead />
            </GlassCard>

            {/* Legend (chips align with map colors) */}
            <GlassCard>
                <ACGLegend
                    planets={Object.keys(lines)}
                    activePlanets={activePlanets}
                    setActivePlanets={setActivePlanets}
                    activeTypes={activeTypes}
                    setActiveTypes={setActiveTypes}
                />
            </GlassCard>

            {/* Fixed-width grid to avoid layout shifts when advice count changes */}
            <div className="grid gap-6 lg:grid-cols-12">
                {/* Advice panel */}
                <GlassCard className="lg:col-span-4">
                    {allThemes.length > 0 ? (
                        <>
                            <div className="p-0">
                                <Tabs value={activeTheme} onValueChange={setActiveTheme} className="w-full">
                                    <TabsList className="w-full flex flex-wrap gap-1">
                                        {allThemes.map((theme) => {
                                            const visible =
                                                adviceFilter === "all"
                                                    ? true
                                                    : adviceFilter === "positive"
                                                        ? themeIsPositive(theme)
                                                        : !themeIsPositive(theme)
                                            return (
                                                <TabsTrigger
                                                    key={theme}
                                                    value={theme}
                                                    className={visible ? "" : "opacity-40 pointer-events-none"}
                                                >
                                                    {theme}
                                                </TabsTrigger>
                                            )
                                        })}
                                    </TabsList>
                                </Tabs>
                            </div>

                            {/* Scroll area keeps overall height fixed */}
                            <div className="mt-3 h-[420px] overflow-y-auto">
                                {(() => {
                                    if (!visibleThemes.length) {
                                        return (
                                            <div className="text-sm text-text/70 p-3">
                                                No tips match this filter. Try <span className="font-medium">All</span>.
                                            </div>
                                        )
                                    }
                                    const validTheme = visibleThemes.includes(activeTheme)
                                        ? activeTheme
                                        : visibleThemes[0]!
                                    const tips = advice[validTheme] ?? []
                                    const isPositive = themeIsPositive(validTheme)
                                    const accent = isPositive
                                        ? "border-l-green-500 bg-green-500/10"
                                        : "border-l-red-500 bg-red-500/10"
                                    const badge = isPositive ? "✔" : "⚠"

                                    return tips.length === 0 ? (
                                        <div className="text-sm text-text/70 p-3">No advice for {validTheme}.</div>
                                    ) : (
                                        <div className="grid gap-3">
                                            {tips.map((tip: string, i: number) => (
                                                <Card
                                                    key={i}
                                                    className={`p-4 border-l-4 transition hover:shadow-md ${accent}`}
                                                >
                                                    <div className="flex items-start gap-2">
                                                        <span className={isPositive ? "text-green-600" : "text-red-600"}>
                                                            {badge}
                                                        </span>
                                                        <p className="text-sm">{tip}</p>
                                                    </div>
                                                </Card>
                                            ))}
                                        </div>
                                    )
                                })()}
                            </div>
                        </>
                    ) : (
                        <div className="text-sm text-text/70 p-3">
                            No tips available from the API.
                        </div>
                    )}
                </GlassCard>

                {/* Map */}
                <GlassCard className="lg:col-span-8 p-0">
                    <div className="relative h-[66vh] min-h-[520px] w-full overflow-hidden rounded-2xl">
                        {/* Inline explainer overlay */}
                        <div className="absolute left-3 top-3 z-[400] rounded-xl border border-border bg-background/80 backdrop-blur px-3 py-2 text-xs text-text/80">
                            <span className="font-medium">Lines:</span>{" "}
                            <span className="text-text/70">
                                ASC (dashed) · MC (solid) · DSC (dot-dash) · IC (long dash)
                            </span>
                            {adviceFilter !== "all" && (
                                <span className="ml-2">
                                    <span className="text-text/60">• Filter:</span>{" "}
                                    {adviceFilter === "positive" ? (
                                        <span className="text-green-600">Supportive</span>
                                    ) : (
                                        <span className="text-red-600">Caution</span>
                                    )}
                                </span>
                            )}
                        </div>

                        <MapContainer center={[20, 0]} zoom={2} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution="&copy; OpenStreetMap contributors"
                            />
                            {activePlanets.map((planet) =>
                                Object.entries(lines[planet] || {}).map(([t, coords], i) => {
                                    const type = t as LineType
                                    // Only gate known four angles by toggle; unknown types still draw
                                    if (
                                        ["ASC", "MC", "DSC", "IC"].includes(String(type).toUpperCase()) &&
                                        !activeTypes.includes(type)
                                    ) {
                                        return null
                                    }
                                    const style = getLineStyle(type)
                                    return (
                                        <Polyline
                                            key={`${planet}-${type}-${i}`}
                                            positions={(coords as { lat: number; lon: number }[]).map((c) => [c.lat, c.lon])}
                                            pathOptions={{
                                                color: getPlanetColor(planet),
                                                weight: style.weight,
                                                dashArray: style.dashArray,
                                                opacity: 0.95,
                                            }}
                                        />
                                    )
                                })
                            )}
                        </MapContainer>
                    </div>
                </GlassCard>
            </div>

            {/* Floating advice filter bar (consistent placement) */}
            <ACGFilterBar value={adviceFilter} onChange={setAdviceFilter} />
        </div>
    )
}

// ---------- Local helpers (styling-only shells to match Cities page) ----------
function Header() {
    return (
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
                <h1 className="text-lg font-semibold tracking-tight">Astrocartography</h1>
                <p className="text-xs text-text/70">
                    Lines by planet and angle · driven by your selected birth data
                </p>
            </div>
            {/* right-side actions slot (if needed) */}
            <div className="flex items-center gap-2" />
        </div>
    )
}

function GlassCard({
    className,
    children,
}: {
    className?: string
    children: React.ReactNode
}) {
    return (
        <section className={`rounded-2xl border border-border bg-surface/70 backdrop-blur p-3 md:p-4 ${className ?? ""}`}>
            {children}
        </section>
    )
}

/* ---------- Collapsible "How to read" (same content as Cities page) ---------- */
function HowToRead() {
    return (
        <details className="rounded-xl border border-border bg-surface/60 backdrop-blur p-3 md:p-4 group open:shadow-md">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                <div className="text-sm font-medium">How to read this map</div>
                <div className="text-xs text-text/70 transition-transform group-open:rotate-180">▼</div>
            </summary>
            <div className="mt-3 space-y-3 text-sm text-text/85">
                <p>
                    Each colored line shows where a planet is strongest by angle:
                    <span className="ml-1 font-medium">ASC</span> (rising, identity),
                    <span className="ml-1 font-medium">MC</span> (career/visibility),
                    <span className="ml-1 font-medium">DSC</span> (partnerships),
                    <span className="ml-1 font-medium">IC</span> (home/roots).
                </p>
                <ul className="list-disc pl-5 space-y-1">
                    <li>
                        <span className="font-medium">Supportive vs Caution</span>: green cards highlight
                        growth-friendly influences; red cards mark areas to pace yourself.
                    </li>
                    <li>
                        <span className="font-medium">Proximity</span>: within ~300–500 km the effects are
                        most noticeable; line crossings intensify.
                    </li>
                    <li>
                        <span className="font-medium">Context</span>: always cross-check with your current
                        dasha/varṣa timing.
                    </li>
                </ul>
                <p className="text-xs text-text/70">
                    Tip: Use the legend’s “All / None” to isolate a single planet, then re-enable others.
                </p>
            </div>
        </details>
    )
}
