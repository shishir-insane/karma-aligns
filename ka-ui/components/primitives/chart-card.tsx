import { cn } from "@/lib/utils"

export default function ChartCard({ title, subtitle, children, className }:{
  title: string
  subtitle?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("bg-surface border border-border rounded-2xl shadow-soft p-6", className)}>
      <div className="mb-3">
        <div className="text-base font-medium">{title}</div>
        {subtitle && <div className="text-sm text-text/70">{subtitle}</div>}
      </div>
      <div className="rounded-xl border border-border h-[360px] grid place-items-center text-text/60">
        {children}
      </div>
    </div>
  )
}
