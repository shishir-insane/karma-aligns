"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Image from "next/image";

type Section = { id: string; label: string };

export default function SiteHeader({ sections = [] as Section[] }: { sections?: Section[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Minimal scroll spy
  const [active, setActive] = useState<string>("");
  const headerHeight = 80; // taller header for larger logo

  useEffect(() => {
    if (!sections.length) return;

    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: `-${headerHeight + 20}px 0px -45% 0px` }
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

  const hasSections = sections.length > 0;

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Minimal shell: soft blur + hairline stroke, no heavy pills */}
        <div className="mt-3 rounded-2xl bg-black/20 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur">
          <div className="flex h-20 items-center gap-4 px-4">
            {/* Brand: larger logo + ALL CAPS wordmark */}
            <button
              onClick={() => router.push("/")}
              aria-label="KarmaAligns Home"
              className="group flex items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/60 rounded-lg"
            >
              <Image
                src="/logo.png"
                width={64}
                height={64}
                alt="Karma Aligns"
                className="rounded-md"
                priority
              />
              <span className="font-heading text-xl tracking-widest text-sky-100 uppercase group-hover:text-white">
                KARMA ALIGNS
              </span>
            </button>

            {/* Nav: minimal text links */}
            {hasSections && (
              <>
                <nav className="ml-2 hidden md:flex items-center gap-2 font-body">
                  {sections.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => scrollToId(s.id)}
                      className={
                        "px-2 py-1 text-sm text-slate-300 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/60 rounded " +
                        (active === s.id
                          ? "text-white border-b border-white/40 pb-0.5"
                          : "hover:text-white hover:border-b hover:border-white/30 pb-0.5 border-b border-transparent")
                      }
                    >
                      {s.label}
                    </button>
                  ))}
                </nav>

                {/* Mobile: simple scrollable text links */}
                <div className="md:hidden ml-2 flex gap-2 overflow-x-auto no-scrollbar font-body">
                  {sections.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => scrollToId(s.id)}
                      className={
                        "whitespace-nowrap px-2 py-1 text-sm text-slate-300 transition rounded " +
                        (active === s.id ? "text-white border-b border-white/40 pb-0.5" : "hover:text-white pb-0.5")
                      }
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Spacer */}
            <div className="ml-auto" />

            {/* Minimal CTA */}
            <button
              onClick={() => router.push("/")}
              className="font-body rounded-full px-4 py-2 text-sm text-white/90 shadow-[0_0_0_1px_rgba(255,255,255,0.12)] hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/60"
            >
              New chart
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
