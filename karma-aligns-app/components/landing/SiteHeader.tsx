"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Image from "next/image";

type Section = { id: string; label: string };

export default function SiteHeader({ sections = [] as Section[] }: { sections?: Section[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [active, setActive] = useState<string>("");
  const headerHeight = 72; // a touch taller, modern feel

  useEffect(() => {
    if (!sections.length) return;
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: `-${headerHeight + 20}px 0px -40% 0px` }
    );
    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [sections]);

  function scrollToId(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - headerHeight - 8;
    window.scrollTo({ top, behavior: "smooth" });
    const qs = searchParams?.toString() ?? "";
    history.replaceState(null, "", `${pathname}${qs ? `?${qs}` : ""}#${id}`);
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Minimal/modern: no heavy borders, gentle blur and subtle stroke */}
        <div className="mt-3 rounded-2xl bg-black/25 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur">
          <div className="flex h-18 items-center gap-3 px-4">
            {/* Logo + wordmark (bigger) */}
            <button onClick={() => router.push("/")} aria-label="KarmaAligns Home" className="flex items-center gap-3">
              <Image src="/logo.png" width={40} height={40} alt="KarmaAligns" className="rounded" />
              <span className="font-heading text-lg tracking-wide text-sky-200 hover:text-sky-100">Karma Aligns</span>
            </button>

            {/* Section pills (keep minimal) */}
            {sections.length > 0 && (
              <>
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
              </>
            )}

            <div className="ml-auto" />
            {/* New chart CTA (kept bold but tidy) */}
            <button
              onClick={() => router.push("/")}
              className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-400 to-fuchsia-400 px-4 py-2 text-sm font-semibold text-slate-900 shadow-lg shadow-fuchsia-500/20 hover:brightness-110"
            >
              <span>New chart</span>
              <span className="transition-transform group-hover:translate-x-0.5">↗</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
