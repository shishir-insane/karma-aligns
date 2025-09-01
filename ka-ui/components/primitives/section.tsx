import { cn } from "@/lib/utils"

export default function Section({ title, children, className }:{
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn("space-y-3", className)}>
      <h3 className="text-xl font-semibold">{title}</h3>
      {children}
    </section>
  )
}
