"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

type Section = { id: string; label: string };

export default function SiteHeader({ sections = [] as Section[] }: { sections?: Section[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [active, setActive] = useState<string>("");
  const headerHeight = 64; // px

  useEffect(() => {
    if (!sections.length) return;

    const opts: IntersectionObserverInit = {
      root: null,
      rootMargin: `-${headerHeight + 20}px 0px -40% 0px`,
      threshold: 0,
    };

    const obs = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) setActive(e.target.id);
      }
    }, opts);

    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });

    return () => obs.disconnect();
  }, [sections]);

  function scrollToId(id: string) {
    const el = document.getElementById(id);
    if (!el) return;

    // Smooth scroll with header offset
    const top = el.getBoundingClientRect().top + window.scrollY - headerHeight - 8;
    window.scrollTo({ top, behavior: "smooth" });
    setActive(id);

    // Preserve the current query string when updating the hash
    const qs = searchParams?.toString() ?? "";
    const url = `${pathname}${qs ? `?${qs}` : ""}#${id}`;
    // Use History API (no router nav) so state/query are preserved
    window.history.replaceState(null, "", url);
  }

  const hasSections = sections.length > 0;

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mt-3 rounded-2xl border border-white/10 bg-black/30 backdrop-blur supports-[backdrop-filter]:bg-black/20">
          <div className="flex h-16 items-center gap-3 px-4">
            {/* Brand */}
            <button
              className="text-base font-semibold tracking-wide text-sky-200 hover:text-sky-100"
              onClick={() => router.push("/")}
              aria-label="KarmaAligns Home"
            >
              KarmaAligns
            </button>

            {/* Sections nav (desktop) */}
            {hasSections && (
              <nav className="ml-2 hidden md:flex items-center gap-1">
                {sections.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => scrollToId(s.id)}
                    className={`rounded-full px-3 py-1 text-sm transition ${
                      active === s.id
                        ? "bg-white/15 text-white"
                        : "text-slate-300 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </nav>
            )}

            {/* Sections nav (mobile) */}
            {hasSections && (
              <div className="md:hidden ml-2 flex gap-2 overflow-x-auto no-scrollbar">
                {sections.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => scrollToId(s.id)}
                    className={`whitespace-nowrap rounded-full px-3 py-1 text-sm transition ${
                      active === s.id
                        ? "bg-white/15 text-white"
                        : "text-slate-300 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}

            <div className="ml-auto" />

            {/* New chart */}
            <button
              onClick={() => router.push("/")}
              className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-sm text-slate-100 hover:bg-white/20"
            >
              New chart
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
