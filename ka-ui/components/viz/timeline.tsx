"use client"
import { cn } from "@/lib/utils"

export type TLItem = { label: string; from: Date; to: Date; level: 1 | 2 | 3 }

export default function Timeline({
  items,
  now = new Date(),
  className,
}: {
  items: TLItem[]
  now?: Date
  className?: string
}) {
  const lanes: Record<number, TLItem[]> = { 1: [], 2: [], 3: [] }
  items.forEach((i) => lanes[i.level].push(i))

  return (
    <div className={cn("w-full h-full p-3 overflow-x-auto", className)}>
      <div className="space-y-4 min-w-[720px] relative">
        {/* simple now marker */}
        <div
          aria-label="Now"
          className="absolute top-0 bottom-0 w-px bg-primary/40 left-1/2"
          style={{ transform: "translateX(0)" }}
        />
        {[1, 2, 3].map((l) => (
          <div key={l} className="relative h-16 rounded-xl border border-border bg-background/50">
            <div className="absolute inset-0 px-2 flex items-center gap-2">
              {lanes[l].map((it, idx) => (
                <div
                  key={idx}
                  className="px-3 py-1 rounded-lg bg-primary/10 text-primary text-sm"
                  title={`${it.from.toISOString()} → ${it.to.toISOString()}`}
                >
                  {it.label}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
