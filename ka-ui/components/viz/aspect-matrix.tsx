"use client"

export default function AspectMatrix({ bodies, get }:{
  bodies: string[] // ordered list of grahas
  get: (aIdx: number, bIdx: number) => { aspect?: string; orb?: number } | null
}) {
  return (
    <div className="w-full h-full p-3 overflow-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="text-left p-2"></th>
            {bodies.map((b, idx) => (
              <th key={idx} className="p-2 text-left text-text/60">{b}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bodies.map((a, r) => (
            <tr key={r} className="border-t border-border">
              <td className="p-2 text-text/60">{a}</td>
              {bodies.map((b, c) => {
                if (r === c) return <td key={c} className="p-2 text-text/40">—</td>
                const cell = get(r, c)
                return (
                  <td key={c} className="p-2">
                    {cell?.aspect ? (
                      <span className="rounded-md bg-primary/10 text-primary px-2 py-0.5">
                        {cell.aspect}{cell.orb != null ? ` · ${cell.orb.toFixed(1)}°` : ""}
                      </span>
                    ) : <span className="text-text/40">·</span>}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
