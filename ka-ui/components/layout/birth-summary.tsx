"use client"

import { useChartMeta } from "@/components/providers/chart-provider"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

function fmtLatLon(lat?: number, lon?: number) {
  if (lat == null || lon == null) return "—"
  const ns = lat >= 0 ? "N" : "S"
  const ew = lon >= 0 ? "E" : "W"
  return `${Math.abs(lat).toFixed(2)}°${ns}, ${Math.abs(lon).toFixed(2)}°${ew}`
}

export default function BirthSummary({ className }: { className?: string }) {
  const { meta } = useChartMeta()
  const {
    name = "Karma Aligns Chart",
    dob = "—",
    tob = "—",
    tz = "—",
    lat,
    lon,
    ayanamsa,
    hsys,
  } = meta

  return (
    <div className={cn("flex items-center gap-2 text-xs", className)}>
      <TooltipProvider delayDuration={80}>
        <Chip label={name} />
        <Divider />
        <Chip label={`DOB: ${dob}`} />
        <Chip label={`TOB: ${tob}`} />
        <Chip label={`TZ: ${tz}`} />
        <Tooltip>
          <TooltipTrigger asChild>
            <Chip label={fmtLatLon(lat, lon)} />
          </TooltipTrigger>
          <TooltipContent side="bottom">Latitude, Longitude</TooltipContent>
        </Tooltip>
        {ayanamsa && <>
          <Divider /><Chip label={`Ayanamsa: ${ayanamsa}`} />
        </>}
        {hsys && <Chip label={`HSys: ${hsys}`} />}
      </TooltipProvider>
    </div>
  )
}

function Chip({ label }: { label: string }) {
  return (
    <span className="px-2 py-1 rounded-lg bg-primary/8 text-text/80 border border-border">
      {label}
    </span>
  )
}
function Divider() { return <span className="h-3 w-px bg-border" /> }
