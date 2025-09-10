
'use client';

import Link from 'next/link';

export default function SiteHeader() {
  return (
    <header className="sticky top-4 z-50 mx-auto max-w-6xl rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-white/10 ring-1 ring-white/15" aria-hidden />
          <span className="font-semibold tracking-tight">Karma Aligns</span>
        </div>
        <nav className="flex items-center gap-2 text-sm text-white/70">
          <Link className="rounded-lg px-2 py-1 hover:text-white focus-visible:focus-ring" href="#form">New chart</Link>
        </nav>
      </div>
    </header>
  );
}
