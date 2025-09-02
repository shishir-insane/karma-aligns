"use client"

import { useMemo } from "react"
import { useChartMeta } from "@/components/providers/chart-provider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

export default function BirthSwitcher({ className }: { className?: string }) {
  const { presets, selectedId, selectPreset } = useChartMeta()

  const options = useMemo(() => presets.map((p) => ({
    id: p.id!, label: p.name || p.id,
    sub: `${p.dob ?? "—"} · ${p.tob ?? "—"} · ${p.tz ?? "—"}`
  })), [presets])

  return (
    <div className={cn("min-w-[220px]", className)}>
      <Select value={selectedId} onValueChange={selectPreset}>
        <SelectTrigger className="h-9 rounded-lg">
          <SelectValue placeholder="Select chart" />
        </SelectTrigger>
        <SelectContent align="end" className="w-[280px]">
          {options.map((o) => (
            <SelectItem key={o.id} value={o.id}>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{o.label}</span>
                <span className="text-[11px] text-text/60">{o.sub}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
