"use client";

import React from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Merriweather_Sans } from "next/font/google";

const merriweatherSans = Merriweather_Sans({ subsets: ["latin"], weight: ["400", "700"], display: "swap" });

export default function SiteHeader() {
  return (
    <header className="absolute inset-x-0 top-0 z-30">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="grid place-items-center h-9 w-9 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 shadow-md">
            <Sparkles className="h-5 w-5" />
          </div>
          <Link href="/" className={`${merriweatherSans.className} font-semibold tracking-wide text-sky-200/90`}>
            Karma Aligns
          </Link>
        </div>

        <div className={`${merriweatherSans.className} hidden md:flex items-center gap-6 text-sm text-slate-300`}>
            <Link className="hover:text-white transition" href="/">Home</Link>
            <Link className="hover:text-white transition" href="/results">Results</Link>
        </div>
      </nav>
    </header>
  );
}
