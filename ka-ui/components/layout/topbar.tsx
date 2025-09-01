"use client"

import { ThemeToggle } from "./theme-toggle"

export default function Topbar() {
  return (
    <header className="sticky top-0 z-40 backdrop-blur border-b border-border bg-background/70">
      <div className="h-14 px-4 flex items-center justify-between">
        <span className="text-sm text-text/70">Celestial Minimalism</span>
        <ThemeToggle />
      </div>
    </header>
  )
}
