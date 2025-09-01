"use client"

import { PLANET_COLORS, PLANET_GLYPHS, LINE_STYLE, LineType } from "@/lib/acg"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Props = {
  planets: string[]
  activePlanets: string[]
  setActivePlanets: (next: string[]) => void
  activeTypes: LineType[]
  setActiveTypes: (next: LineType[]) => void
  className?: string
}

const ALL_TYPES: LineType[] = ["ASC", "MC", "DSC", "IC"]

export default function ACGLegend({
  planets,
  activePlanets,
  setActivePlanets,
  activeTypes,
  setActiveTypes,
  className,
}: Props) {
  const togglePlanet = (p: string) =>
    setActivePlanets(
      activePlanets.includes(p)
        ? activePlanets.filter((x) => x !== p)
        : [...activePlanets, p]
    )

  const toggleType = (t: LineType) =>
    setActiveTypes(
      activeTypes.includes(t) ? activeTypes.filter((x) => x !== t) : [...activeTypes, t]
    )

  return (
    <div className={cn("card-astro p-4 border-ambient", className)}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="text-sm font-medium">Legend & Filters</h3>
        <div className="flex gap-2">
          <Button
            variant="subtle"
            size="sm"
            onClick={() => setActivePlanets(planets)}
            title="Show all planets"
          >
            All
          </Button>
          <Button
            variant="subtle"
            size="sm"
            onClick={() => setActivePlanets([])}
            title="Hide all planets"
          >
            None
          </Button>
        </div>
      </div>

      {/* Planets */}
      <div className="mt-3 grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {planets.map((p) => {
          const on = activePlanets.includes(p)
          return (
            <button
              key={p}
              onClick={() => togglePlanet(p)}
              className={cn(
                "group flex items-center gap-2 rounded-lg px-3 py-2 border transition",
                on
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "border-border bg-background/50 hover:bg-background/70 text-text/80"
              )}
            >
              <span
                aria-hidden
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: PLANET_COLORS[p] || "#0ea5e9" }}
              />
              <span className="font-medium tabular-nums">{PLANET_GLYPHS[p] ?? "•"}</span>
              <span className="text-sm">{p}</span>
            </button>
          )
        })}
      </div>

      {/* Line Types */}
      <div className="mt-4">
        <div className="text-xs text-text/70 mb-2">Line types</div>
        <div className="flex flex-wrap gap-2">
          {ALL_TYPES.map((t) => {
            const style = LINE_STYLE[t]
            const on = activeTypes.includes(t)
            return (
              <button
                key={t}
                onClick={() => toggleType(t)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-1.5 border text-sm transition",
                  on
                    ? "border-primary/50 bg-primary/10 text-primary"
                    : "border-border bg-background/50 hover:bg-background/70 text-text/80"
                )}
                title={t}
              >
                <span
                  aria-hidden
                  className="h-0.5 w-7"
                  style={{
                    background: "currentColor",
                    // emulate dash styles visually in legend
                    maskImage: style.dashArray ? `repeating-linear-gradient(90deg, #000 0, #000 12px, transparent 12px, transparent 18px)` : undefined,
                    opacity: 0.8,
                  }}
                />
                {t}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
