"use client"

import Topbar from "./topbar"
import Sidebar from "./sidebar"

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid grid-cols-[260px_1fr] lg:grid-cols-[280px_1fr]">
      <Sidebar />
      <div className="flex flex-col">
        <Topbar />
        <main className="p-4 md:p-8 space-y-8">{children}</main>
      </div>
    </div>
  )
}
