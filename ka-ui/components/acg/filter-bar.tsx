"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type AdviceFilter = "all" | "positive" | "caution"

export default function ACGFilterBar({
  value,
  onChange,
  className,
}: {
  value: AdviceFilter
  onChange: (next: AdviceFilter) => void
  className?: string
}) {
  return (
    <div
      className={cn(
        "fixed bottom-5 right-5 z-[500] glass border border-border rounded-2xl px-2 py-2 shadow-sm",
        "flex items-center gap-2",
        className
      )}
      role="group"
      aria-label="Filter advice"
    >
      <Button
        size="sm"
        variant={value === "all" ? "default" : "subtle"}
        onClick={() => onChange("all")}
        aria-pressed={value === "all"}
      >
        All
      </Button>
      <Button
        size="sm"
        variant={value === "positive" ? "default" : "subtle"}
        onClick={() => onChange("positive")}
        aria-pressed={value === "positive"}
      >
        ✔ Supportive
      </Button>
      <Button
        size="sm"
        variant={value === "caution" ? "default" : "subtle"}
        onClick={() => onChange("caution")}
        aria-pressed={value === "caution"}
      >
        ⚠ Caution
      </Button>
    </div>
  )
}
