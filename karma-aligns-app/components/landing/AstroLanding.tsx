"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import Starfield from "./Starfield";
import BirthForm, { BirthFormValues } from "./BirthForm";
import AmbientBodies from "./AmbientBodies"; // your existing stars/planets/moon
import SiteHeader from "./SiteHeader";
import { useRouter } from "next/navigation";

export default function AstroLanding({ wheelSrc = "/karma-wheel.png" }: { wheelSrc?: string }) {
  const [wheelPaused, setWheelPaused] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function handleSubmit(values: BirthFormValues) {
    setSubmitting(true);
    const varsha_year = new Date().getFullYear() + 1;
    const qs = new URLSearchParams({
      dob: values.date,
      tob: values.time,
      tz: values.tz,
      lat: values.lat,
      lon: values.lon,
      varsha_year: String(varsha_year),
    }).toString();
    router.push(`/results?${qs}`);
    setSubmitting(false);
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[radial-gradient(100%_120%_at_50%_0%,#0b1020_0%,#0a0720_40%,#0a0720_60%,#080616_100%)] text-white font-body">
      <Starfield />
      <SiteHeader />

      {/* Hero / Form */}
      <section className="relative z-20 mx-auto grid min-h-screen max-w-7xl grid-cols-1 items-center gap-10 px-6 pt-28 md:grid-cols-2">
        {/* Left column — Title + Copy + Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="order-2 md:order-1"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] tracking-wide text-sky-200/80 backdrop-blur">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-sky-300/80" />
            Enter your birth details
          </div>

          <h1 className="font-heading text-5xl leading-tight tracking-wide md:text-6xl">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-300 via-indigo-300 to-fuchsia-300">
              Balance your karma
            </span>
            <span className="mt-2 block text-4xl text-sky-200/95 md:text-5xl">Align your life</span>
          </h1>

          <p className="mt-5 max-w-xl text-sm font-medium text-slate-300/95 md:text-base">
            Submit your birth details to begin.
          </p>

          <BirthForm onSubmit={handleSubmit} submitting={submitting} />
        </motion.div>

        {/* Right column — Rotating wheel + existing moon with subtle phase overlay */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="order-1 md:order-2 relative"
        >
          <div
            className="relative mx-auto aspect-square w-[90%] max-w-[640px]"
            onMouseEnter={() => setWheelPaused(true)}
            onMouseLeave={() => setWheelPaused(false)}
            style={{
              animation: "spin_slow_90s 90s linear infinite",
              animationPlayState: wheelPaused ? "paused" : "running",
            }}
          >
            <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_50%,#8ecbff22,transparent_60%)]" />
            <img
              src={wheelSrc}
              alt="Zodiac Wheel"
              className="relative z-10 h-full w-full select-none rounded-full opacity-95 will-change-transform"
              draggable={false}
            />
            <div className="absolute bottom-8 left-1/2 z-0 h-24 w-24 -translate-x-1/2 rounded-full bg-black/50 blur-2xl" />
          </div>

          {/* EXISTING ambient bodies (includes your moon visual) */}
          <AmbientBodies />

          {/* SUBTLE PHASE OVERLAY:
              This dark circular mask gently slides across the existing moon to simulate phases.
              Position it to sit over your current moon. Adjust top/right & size if needed. */}
          <div
            className="pointer-events-none absolute right-2 top-2 md:right-6 md:top-6"
            style={{ width: 72, height: 72 }}
            aria-hidden
          >
            <div
              className="ka-moon-phase-overlay absolute inset-0 rounded-full"
              style={{
                // dark overlay color matches page bg so it looks like shadow
                background: "#0b1020",
                mixBlendMode: "multiply",
                // slide horizontally to simulate waxing/waning
                animation: "ka_lunar 36s ease-in-out infinite",
                // make edge slightly soft like a terminator line
                boxShadow: "0 0 2px rgba(0,0,0,0.35)",
                // keep the overlay strictly circular
                WebkitMaskImage: "radial-gradient(circle at center, black 60%, transparent 62%)",
                maskImage: "radial-gradient(circle at center, black 60%, transparent 62%)",
              }}
            />
          </div>
        </motion.div>

        <style>{`
          @keyframes spin_slow_90s {
            from { transform: rotate(0deg); }
            to   { transform: rotate(360deg); }
          }
          @keyframes ka_lunar {
            0%   { transform: translateX(-38%); opacity: 1; }
            25%  { transform: translateX(0%);   opacity: 0.95; }
            50%  { transform: translateX(38%);  opacity: 1; }
            75%  { transform: translateX(0%);   opacity: 0.95; }
            100% { transform: translateX(-38%); opacity: 1; }
          }
          @media (prefers-reduced-motion: reduce) {
            .ka-moon-phase-overlay { animation: none !important; }
          }
        `}</style>
      </section>
    </div>
  );
}
