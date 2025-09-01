"use client"
import { cn } from "@/lib/utils"

type Cell = { idx: number; label: string; grahas?: string[] }
export default function RashiCanvas({ cells, className }:{
  cells: Cell[] // 12 cells; label like "Aries", grahas ["Sun","Mars"]
  className?: string
}) {
  return (
    <div className={cn("grid grid-cols-3 grid-rows-4 gap-2 w-full h-full p-2", className)}>
      {cells.map(c => (
        <div key={c.idx} className="border border-border rounded-lg p-2 flex flex-col">
          <div className="text-[11px] text-text/60">{c.label}</div>
          <div className="mt-auto text-sm">{(c.grahas || []).join(" · ") || "—"}</div>
        </div>
      ))}
    </div>
  )
}
