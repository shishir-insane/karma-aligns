"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import Starfield from "./Starfield";
import BirthForm, { BirthFormValues } from "./BirthForm";
import AmbientBodies from "./AmbientBodies";
import PlanetTable from "./PlanetTable";
import PlanetOverlay from "./PlanetOverlay";

// Fonts: Merriweather (serif) & Merriweather Sans (sans-serif)
import { Merriweather, Merriweather_Sans } from "next/font/google";
const merriweather = Merriweather({ subsets: ["latin"], weight: ["700"], display: "swap" });
const merriweatherSans = Merriweather_Sans({ subsets: ["latin"], weight: ["400", "700"], display: "swap" });

type PlanetEntry = { lon: number; retrograde: boolean | null; speed: number | null };
type PlanetsDict = Record<string, PlanetEntry>;
type ApiResponse = { chart_id: string; planets: PlanetsDict };

export default function AstroLanding({ wheelSrc = "/karma-wheel.png" }: { wheelSrc?: string }) {
  const [wheelPaused, setWheelPaused] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [mode, setMode] = useState<"form" | "results">("form");
  const [apiError, setApiError] = useState<string | null>(null);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [selectedPlanet, setSelectedPlanet] = useState<string | null>(null);

  async function handleSubmit(values: BirthFormValues) {
    try {
      setSubmitting(true);
      setApiError(null);

      const varsha_year = new Date().getFullYear() + 1; // default like your example (e.g., 2026)
      const qs = new URLSearchParams({
        dob: values.date,
        tob: values.time,
        tz: values.tz,
        lat: values.lat,
        lon: values.lon,
        varsha_year: String(varsha_year),
      }).toString();

      const url = `http://localhost:5000/api/v1/planets?${qs}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const json: ApiResponse = await res.json();

      setData(json);
      setMode("results");
      // default select Sun if present, else first key
      const def =
        Object.keys(json.planets).includes("Sun")
          ? "Sun"
          : Object.keys(json.planets)[0] ?? null;
      setSelectedPlanet(def);
    } catch (e: any) {
      setApiError(e?.message ?? "Failed to fetch.");
    } finally {
      setSubmitting(false);
    }
  }

  const planetArray = useMemo(
    () =>
      data
        ? (Object.entries(data.planets) as [string, PlanetEntry][])
            // keep a stable, nice ordering if you prefer:
            .sort((a, b) => a[0].localeCompare(b[0]))
        : [],
    [data]
  );

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[radial-gradient(100%_120%_at_50%_0%,#0b1020_0%,#0a0720_40%,#0a0720_60%,#080616_100%)] text-white">
      <Starfield />

      <header className="absolute inset-x-0 top-0 z-30">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2">
            <div className="grid place-items-center h-9 w-9 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 shadow-md">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className={`${merriweatherSans.className} font-semibold tracking-wide text-sky-200/90`}>
              Karma Aligns
            </span>
          </div>

          <div className={`${merriweatherSans.className} hidden md:flex items-center gap-6 text-sm text-slate-300`}>
            {mode === "results" ? (
              <>
                <button
                  onClick={() => setMode("form")}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 hover:bg-white/10 transition"
                >
                  New chart
                </button>
                {data?.chart_id ? (
                  <span className="text-xs text-slate-400">chart_id: {data.chart_id.slice(0, 10)}…</span>
                ) : null}
              </>
            ) : (
              <>
                <a className="hover:text-white transition" href="#guide">Guide</a>
                <a className="hover:text-white transition" href="#features">Features</a>
                <a className="hover:text-white transition" href="#contact">Contact</a>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* ==== FORM VIEW ==== */}
      {mode === "form" && (
        <section className="relative z-20 mx-auto grid min-h-screen max-w-7xl grid-cols-1 items-center gap-10 px-6 pt-28 md:grid-cols-2">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="order-2 md:order-1">
            <div className={`${merriweatherSans.className} mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] tracking-wide text-sky-200/80 backdrop-blur`}>
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-sky-300/80" />
              Enter your birth details
            </div>

            <h1 className={`${merriweather.className} text-5xl md:text-6xl leading-tight tracking-wide`}>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-300 via-indigo-300 to-fuchsia-300">
                Balance your karma
              </span>
              <span className={`${merriweatherSans.className} block text-4xl md:text-5xl mt-2 text-sky-200/95`}>
                Align your life
              </span>
            </h1>

            <p className={`${merriweatherSans.className} mt-5 max-w-xl text-slate-300/95 text-sm md:text-base font-medium`}>
              Submit your birth details to begin.
            </p>

            <BirthForm onSubmit={handleSubmit} submitting={submitting} />

            {apiError ? (
              <p className="mt-3 text-sm text-rose-300/90">{apiError}</p>
            ) : null}
          </motion.div>

          {/* Right column — Rotating Zodiac Wheel (kept for hero) */}
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }} className="order-1 md:order-2 relative">
            <div
              className="relative mx-auto aspect-square w-[90%] max-w-[640px]"
              onMouseEnter={() => setWheelPaused(true)}
              onMouseLeave={() => setWheelPaused(false)}
              style={{
                animation: "spin_slow_90s 90s linear infinite",
                animationPlayState: wheelPaused ? "paused" : "running",
              }}
            >
              {/* Glow */}
              <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_50%,#8ecbff22,transparent_60%)]" />

              {/* Wheel image */}
              <img
                src={wheelSrc}
                alt="Zodiac Wheel"
                className="relative z-10 h-full w-full select-none rounded-full opacity-95 will-change-transform"
                draggable={false}
              />

              {/* Silhouette */}
              <div className="absolute bottom-8 left-1/2 z-0 h-24 w-24 -translate-x-1/2 rounded-full bg-black/50 blur-2xl" />
            </div>

            <AmbientBodies />
          </motion.div>

          <style>{`@keyframes spin_slow_90s { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </section>
      )}

      {/* ==== RESULTS VIEW ==== */}
      {mode === "results" && data && (
        <section className="relative z-20 mx-auto grid min-h-screen max-w-7xl grid-cols-1 items-start gap-10 px-6 pt-28 lg:grid-cols-2">
          {/* Wheel + overlay (rotate together) */}
          <div className="order-2 lg:order-1">
            <h2 className={`${merriweather.className} text-2xl text-sky-200 mb-3`}>Planet placements</h2>
            <div
              className="relative mx-auto aspect-square w-[92%] max-w-[700px]"
              onMouseEnter={() => setWheelPaused(true)}
              onMouseLeave={() => setWheelPaused(false)}
              style={{
                animation: "spin_slow_90s 90s linear infinite",
                animationPlayState: wheelPaused ? "paused" : "running",
              }}
            >
              <img
                src={wheelSrc}
                alt="Zodiac Wheel"
                className="absolute inset-0 h-full w-full select-none rounded-full opacity-95"
                draggable={false}
              />
              {/* Overlay markers rotate with the wheel because they share the same rotating wrapper */}
              <PlanetOverlay
                planets={data.planets}
                selected={selectedPlanet}
                onSelect={setSelectedPlanet}
              />
            </div>
            <p className={`${merriweatherSans.className} mt-3 text-xs text-slate-400`}>
              Tip: hover a row or a marker to highlight; pause rotation by hovering the wheel.
            </p>
          </div>

          {/* Table */}
          <div className="order-1 lg:order-2">
            <h2 className={`${merriweather.className} text-2xl text-sky-200 mb-3`}>Planet table</h2>
            <PlanetTable
              rows={planetArray}
              selected={selectedPlanet}
              onHover={setSelectedPlanet}
            />

            <div className="mt-6 flex gap-3">
              <button
                className={`${merriweatherSans.className} rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10 transition`}
                onClick={() => setMode("form")}
              >
                New submission
              </button>
              <button
                className={`${merriweatherSans.className} rounded-2xl bg-[#e0577d] px-4 py-2 text-sm font-medium text-white shadow-lg shadow-[#e0577d22] hover:brightness-110`}
                onClick={() => setMode("results")}
              >
                Stay on results
              </button>
            </div>
          </div>

          <style>{`@keyframes spin_slow_90s { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </section>
      )}
    </div>
  );
}
