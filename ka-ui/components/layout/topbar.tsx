"use client"

import { ThemeToggle } from "./theme-toggle"
import BirthSummary from "@/components/layout/birth-summary"
import BirthSwitcher from "@/components/layout/birth-switcher"

export default function Topbar() {
  return (
    <header className="sticky top-0 z-40 glass border-b border-border">
      <div className="h-14 px-4 flex items-center justify-between">
        <BirthSwitcher />
        <BirthSummary />
        <ThemeToggle />
      </div>
    </header>
  )
}
