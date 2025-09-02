"use client"

import * as React from "react"
import {
  ColumnDef,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  SortingState,
  useReactTable,
  ColumnFiltersState,
  FilterFn,
} from "@tanstack/react-table"
import { ACGCityRow } from "@/lib/api-client"
import { getPlanetGlyph, getPlanetColor } from "@/lib/acg"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { flexRender } from "@tanstack/react-table"

const ANGLES = ["ASC", "MC", "DSC", "IC"] as const

/* ---------------- Filter functions ---------------- */

// country + city substring match (value: { country?: string; name?: string })
const cityMatch: FilterFn<ACGCityRow> = (row, _colId, value?: { country?: string; name?: string }) => {
  if (!value) return true
  const nm = String(row.original.name).toLowerCase()
  const cc = String(row.original.country).toLowerCase()
  const passCountry = value.country ? cc.includes(value.country) : true
  const passName = value.name ? nm.includes(value.name) : true
  return passCountry && passName
}

// equals (case-insensitive) for planet
const equalsIgnoreCase: FilterFn<ACGCityRow> = (row, colId, value?: string) => {
  if (!value) return true
  const v = String(row.getValue(colId) ?? "").toLowerCase()
  return v === value.toLowerCase()
}

// equals (upper) for angle
const equalsUpper: FilterFn<ACGCityRow> = (row, colId, value?: string) => {
  if (!value) return true
  const v = String(row.getValue(colId) ?? "").toUpperCase()
  return v === value.toUpperCase()
}

// distance filters (value can be "hasHit" OR { lte: number })
const distanceFilter: FilterFn<ACGCityRow> = (row, _colId, value?: any) => {
  const d = row.original.distance_km
  if (value === "hasHit") return d != null
  if (value?.lte != null) {
    if (d == null) return false
    return d <= Number(value.lte)
  }
  return true
}

/* ---------------- Columns ---------------- */

const columns: ColumnDef<ACGCityRow>[] = [
  {
    id: "city",
    header: "City",
    accessorFn: (r) => r.name,
    filterFn: cityMatch,
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium">{row.original.name}</span>
        <span className="text-xs text-text/60">{row.original.country}</span>
      </div>
    ),
    sortingFn: "alphanumeric",
  },
  {
    id: "planet",
    header: "Planet",
    accessorFn: (r) => r.planet ?? "",
    filterFn: equalsIgnoreCase,
    cell: ({ row }) => {
      const p = row.original.planet
      if (!p) return <span className="text-xs text-text/50">—</span>
      return (
        <span className="inline-flex items-center gap-1">
          <span style={{ color: getPlanetColor(p) }}>{getPlanetGlyph(p)}</span>
          <span>{p}</span>
        </span>
      )
    },
    enableSorting: true,
  },
  {
    id: "angle",
    header: "Angle",
    accessorFn: (r) => r.angle ?? "",
    filterFn: equalsUpper,
    cell: ({ row }) => <span>{row.original.angle ?? "—"}</span>,
    enableSorting: true,
  },
  {
    id: "distance",
    header: "Distance (km)",
    accessorFn: (r) => (r.distance_km == null ? Number.POSITIVE_INFINITY : r.distance_km),
    filterFn: distanceFilter,
    sortingFn: "alphanumeric",
    cell: ({ row }) =>
      row.original.distance_km != null ? (
        <span>{row.original.distance_km.toFixed(1)}</span>
      ) : (
        <span className="text-xs text-text/50">—</span>
      ),
  },
  {
    id: "coords",
    header: "Lat / Lon",
    accessorFn: (r) => `${r.lat},${r.lon}`,
    enableSorting: false,
    cell: ({ row }) => (
      <span className="text-xs text-text/70">
        {row.original.lat.toFixed(2)}°, {row.original.lon.toFixed(2)}°
      </span>
    ),
  },
  {
    id: "advice",
    header: "Advice",
    accessorFn: (r) => r.advice ?? "",
    enableSorting: false,
    cell: ({ row }) =>
      row.original.advice ? <span className="text-xs">{row.original.advice}</span> : <span className="text-xs text-text/50">—</span>,
  },
]

type Props = { data: ACGCityRow[]; className?: string }

export default function CitiesTable({ data, className }: Props) {
  const [sorting, setSorting] = React.useState<SortingState>([{ id: "distance", desc: false }])
  const [filters, setFilters] = React.useState<ColumnFiltersState>([])

  const [countryQuery, setCountryQuery] = React.useState("")
  const [cityQuery, setCityQuery] = React.useState("")
  const [planetFilter, setPlanetFilter] = React.useState<string>("all")
  const [angleFilter, setAngleFilter] = React.useState<string>("all")
  const [hitOnly, setHitOnly] = React.useState(false)
  const [maxDist, setMaxDist] = React.useState<number | "">("")

  // derive unique planets for dropdown
  const planets = React.useMemo(() => {
    const s = new Set<string>()
    data.forEach((r) => r.planet && s.add(r.planet))
    return Array.from(s).sort((a, b) => a.localeCompare(b))
  }, [data])

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters: filters },
    onSortingChange: setSorting,
    onColumnFiltersChange: setFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    filterFns: {
      cityMatch,
      equalsIgnoreCase,
      equalsUpper,
      distanceFilter,
    },
  })

  // Build columnFilters from UI controls
  React.useEffect(() => {
    const next: ColumnFiltersState = []

    if (countryQuery || cityQuery) {
      next.push({
        id: "city",
        value: {
          country: countryQuery.trim().toLowerCase(),
          name: cityQuery.trim().toLowerCase(),
        } as any,
      })
    }

    if (planetFilter !== "all") next.push({ id: "planet", value: planetFilter })
    if (angleFilter !== "all") next.push({ id: "angle", value: angleFilter })
    if (hitOnly) next.push({ id: "distance", value: "hasHit" })
    if (maxDist !== "") next.push({ id: "distance", value: { lte: Number(maxDist) } as any })

    setFilters(next)
  }, [countryQuery, cityQuery, planetFilter, angleFilter, hitOnly, maxDist])

  return (
    <Card className={cn("p-3 md:p-4", className)}>
      {/* Controls */}
      <div className="mb-3 grid gap-2 md:grid-cols-12">
        <Input
          placeholder="Filter country…"
          value={countryQuery}
          onChange={(e) => setCountryQuery(e.target.value)}
          className="md:col-span-3"
        />
        <Input
          placeholder="Filter city…"
          value={cityQuery}
          onChange={(e) => setCityQuery(e.target.value)}
          className="md:col-span-3"
        />
        <Select value={planetFilter} onValueChange={setPlanetFilter}>
          <SelectTrigger className="md:col-span-2 h-9">
            <SelectValue placeholder="Planet" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All planets</SelectItem>
            {planets.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={angleFilter} onValueChange={setAngleFilter}>
          <SelectTrigger className="md:col-span-2 h-9">
            <SelectValue placeholder="Angle" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All angles</SelectItem>
            {ANGLES.map((a) => (
              <SelectItem key={a} value={a}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="md:col-span-2 flex items-center gap-2">
          <Input
            type="number"
            inputMode="numeric"
            placeholder="Max km"
            value={maxDist === "" ? "" : String(maxDist)}
            onChange={(e) => setMaxDist(e.target.value === "" ? "" : Number(e.target.value))}
            className="h-9"
          />
          <Button variant={hitOnly ? "default" : "ghost"} onClick={() => setHitOnly((v) => !v)} className="h-9">
            Hits only
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/30">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => (
                  <th
                    key={h.id}
                    className="text-left font-medium px-3 py-2 select-none cursor-pointer"
                    onClick={h.column.getToggleSortingHandler()}
                  >
                    {h.isPlaceholder ? null : (h.column.columnDef.header as any)}
                    {{
                      asc: " ↑",
                      desc: " ↓",
                    }[h.column.getIsSorted() as string] ?? null}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((r) => (
              <tr key={r.id} className="border-t border-border/70 hover:bg-muted/20">
                {r.getVisibleCells().map((c) => (
                  <td key={c.id} className="px-3 py-2">
                    {flexRender(c.column.columnDef.cell, c.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {table.getRowModel().rows.length === 0 && (
          <div className="p-6 text-center text-sm text-text/60">No cities match the current filters.</div>
        )}
      </div>
    </Card>
  )
}
