import { cn } from "@/lib/utils"

export default function MetricCard({ label, value, className }:{
  label: string
  value: string | number
  className?: string
}) {
  return (
    <div className={cn("rounded-xl border border-border bg-surface px-4 py-3", className)}>
      <div className="text-[11px] uppercase tracking-wide text-text/60">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  )
}
