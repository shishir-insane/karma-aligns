"use client"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

export default function NowCard({
  title,
  kpis,
  className
}: {
  title: string
  kpis: [string, string | number][]
  className?: string
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.18 }}
      className={cn("card-astro p-5 border-ambient", className)}
    >
      <div className="text-sm text-text/70 mb-2">{title}</div>
      <div className="grid grid-cols-2 gap-3">
        {kpis.map(([k, v]) => (
          <div key={k} className="rounded-lg border border-border px-3 py-2 bg-background/40">
            <div className="text-[11px] uppercase tracking-wide text-text/60">{k}</div>
            <div className="text-lg font-semibold">{v}</div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
