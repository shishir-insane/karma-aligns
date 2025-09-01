"use client"

import { useEffect, useMemo, useState } from "react"
import dynamic from "next/dynamic"
import { fetchJSON } from "@/lib/api-client"
import ACGLegend from "@/components/acg/legend"
import { PLANET_COLORS, LINE_STYLE, LineType } from "@/lib/acg"
import { Card } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

// Lazy imports for Leaflet
const MapContainer = dynamic(() => import("react-leaflet").then((m) => m.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import("react-leaflet").then((m) => m.TileLayer), { ssr: false })
const Polyline = dynamic(() => import("react-leaflet").then((m) => m.Polyline), { ssr: false })

type Coord = { lat: number; lon: number }
type Lines = Record<string, Record<LineType, Coord[]>>

type AcgResponse = {
  acg: {
    advice: Record<string, string[]>
    lines: Lines
  }
}

export default function AstrocartographyPage() {
  const [data, setData] = useState<AcgResponse | null>(null)
  const [loading, setLoading] = useState(true)

  // Filters
  const [activePlanets, setActivePlanets] = useState<string[]>([])
  const [activeTypes, setActiveTypes] = useState<LineType[]>(["ASC", "MC", "DSC", "IC"])

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetchJSON<AcgResponse>(
          "/api/v1/acg",
          { dob: "1984-09-24", tob: "17:32", tz: "+05:30", lat: 26.7606, lon: 83.3732 }
        )
        setData(res)
        // initialize filter set with available planets
        const planets = Object.keys(res.acg.lines)
        setActivePlanets(planets)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) return <div className="p-6">Loading astrocartography…</div>
  if (!data) return <div className="p-6">No data found.</div>

  const { advice, lines } = data.acg
  const planets = useMemo(() => Object.keys(lines), [lines])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Astrocartography</h1>

      {/* Legend + Filters */}
      <ACGLegend
        planets={planets}
        activePlanets={activePlanets}
        setActivePlanets={setActivePlanets}
        activeTypes={activeTypes}
        setActiveTypes={setActiveTypes}
      />

      {/* Advice */}
      <Tabs defaultValue={Object.keys(advice)[0] ?? "Advice"} className="w-full">
        <TabsList>
          {Object.keys(advice).map((k) => (
            <TabsTrigger key={k} value={k}>{k}</TabsTrigger>
          ))}
        </TabsList>
        {Object.entries(advice).map(([k, tips]) => (
          <TabsContent key={k} value={k} className="grid gap-3 md:grid-cols-2">
            {tips.map((tip, i) => (
              <Card key={i} className="p-4">{tip}</Card>
            ))}
          </TabsContent>
        ))}
      </Tabs>

      {/* Map */}
      <div className="h-[600px] w-full rounded-xl overflow-hidden border border-border">
        <MapContainer center={[20, 0]} zoom={2} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
          {activePlanets.map((planet) =>
            Object.entries(lines[planet] || {}).map(([t, coords], i) => {
              const type = t as LineType
              if (!activeTypes.includes(type)) return null
              const style = LINE_STYLE[type]
              return (
                <Polyline
                  key={`${planet}-${type}-${i}`}
                  positions={coords.map((c) => [c.lat, c.lon])}
                  pathOptions={{
                    color: PLANET_COLORS[planet] || "#0ea5e9",
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
    </div>
  )
}
