import { cn } from "@/lib/utils"
import MetricCard from "./metric-card"

export default function NowCard({ title, kpis, className }:{
  title: string
  kpis: [string, string | number][]
  className?: string
}) {
  return (
    <div className={cn("bg-surface border border-border rounded-2xl shadow-soft p-5", className)}>
      <div className="text-sm text-text/70 mb-2">{title}</div>
      <div className="grid grid-cols-2 gap-3">
        {kpis.map(([k, v]) => <MetricCard key={k} label={k} value={v} />)}
      </div>
    </div>
  )
}
