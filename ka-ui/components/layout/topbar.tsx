"use client"

import { ThemeToggle } from "./theme-toggle"

export default function Topbar() {
  return (
    <header className="sticky top-0 z-40 glass border-b border-border">
      <div className="h-14 px-4 flex items-center justify-between">
        <span className="text-sm text-text/70">Celestial Minimalism</span>
        <ThemeToggle />
      </div>
    </header>
  )
}
