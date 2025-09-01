"use client"

export default function Heatmap({ rows, cols, get, rowLabels, colLabels }:{
  rows: number
  cols: number
  get: (r: number, c: number) => number // 0..8 bindus; normalize inside
  rowLabels?: string[]
  colLabels?: string[]
}) {
  const max = 8
  return (
    <div className="w-full h-full p-3">
      <div className="grid" style={{ gridTemplateColumns: `120px repeat(${cols}, minmax(0,1fr))` }}>
        <div />
        {Array.from({ length: cols }).map((_, c) => (
          <div key={c} className="text-[11px] text-center text-text/60">{colLabels?.[c] ?? c + 1}</div>
        ))}
        {Array.from({ length: rows }).map((_, r) => (
          <>
            <div key={`r${r}`} className="text-[11px] text-text/60">{rowLabels?.[r] ?? r + 1}</div>
            {Array.from({ length: cols }).map((_, c) => {
              const v = get(r, c)
              const pct = Math.max(0, Math.min(1, v / max))
              return (
                <div
                  key={`${r}-${c}`}
                  className="aspect-square rounded-md border border-border"
                  style={{ background: `linear-gradient(180deg, hsl(var(--secondary)) ${pct*100}%, transparent 0)` }}
                  title={`${v} bindus`}
                />
              )
            })}
          </>
        ))}
      </div>
    </div>
  )
}
