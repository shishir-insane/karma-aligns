"use client"

import { cn } from "@/lib/utils"

export function Page({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("space-y-6", className)}>
      {children}
    </div>
  )
}

export function PageHeader({
  title,
  subtitle,
  actions,
  className,
}: {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn(
      "flex flex-col gap-2 md:flex-row md:items-end md:justify-between",
      className
    )}>
      <div>
        <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-text/70">{subtitle}</p>}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  )
}

export function SectionCard({
  children,
  className,
  header,
}: {
  children: React.ReactNode
  className?: string
  header?: React.ReactNode
}) {
  return (
    <section className={cn("rounded-2xl border border-border bg-surface/70 backdrop-blur", className)}>
      {header ? (
        <div className="px-3 py-2 md:px-4 md:py-3 border-b border-border rounded-t-2xl">
          {header}
        </div>
      ) : null}
      <div className="p-3 md:p-4">{children}</div>
    </section>
  )
}
