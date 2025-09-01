"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Grid, LineChart, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/natal", label: "Natal", icon: Grid },
  { href: "/timing", label: "Timing", icon: LineChart },
  { href: "/strengths", label: "Strengths", icon: Zap },
]

export default function Sidebar() {
  const pathname = usePathname()
  return (
    <aside className="hidden md:flex md:flex-col border-r border-border bg-surface">
      <div className="p-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="h-8 w-8 rounded-full bg-primary/20 grid place-items-center text-primary font-bold">★</span>
          <span className="text-lg font-semibold">Astro UI</span>
        </Link>
      </div>
      <nav className="px-2 mt-2 space-y-1">
        {NAV.map(item => {
          const Icon = item.icon
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition",
                active ? "bg-primary/10 text-primary" : "text-text/80 hover:bg-primary/5 hover:text-text"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
