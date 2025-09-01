"use client"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

export default function ChartCard({
  title,
  subtitle,
  children,
  className
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 320, damping: 26, mass: 0.6 }}
      className={cn("card-astro p-6 border-ambient", className)}
    >
      <div className="mb-3">
        <div className="text-base font-medium">{title}</div>
        {subtitle && <div className="text-sm text-text/70">{subtitle}</div>}
      </div>
      <div className="rounded-xl border border-border h-[360px] grid place-items-center text-text/60 bg-background/40">
        {children}
      </div>
    </motion.div>
  )
}
