"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import Starfield from "./Starfield";
import BirthForm from "./BirthForm";
import AmbientBodies from "./AmbientBodies";

// ✅ Use Merriweather (serif) & Merriweather Sans (sans-serif)
import { Merriweather, Merriweather_Sans } from "next/font/google";
const merriweather = Merriweather({ subsets: ["latin"], weight: ["700"], display: "swap" });
const merriweatherSans = Merriweather_Sans({ subsets: ["latin"], weight: ["400", "700"], display: "swap" });

export default function AstroLanding({ wheelSrc = "/karma-wheel.png" }: { wheelSrc?: string }) {
  const [wheelPaused, setWheelPaused] = useState(false);

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
            <a className="hover:text-white transition" href="#guide">Guide</a>
            <a className="hover:text-white transition" href="#features">Features</a>
            <a className="hover:text-white transition" href="#contact">Contact</a>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative z-20 mx-auto grid min-h-screen max-w-7xl grid-cols-1 items-center gap-10 px-6 pt-28 md:grid-cols-2">
        {/* Left column — Title + Copy + Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="order-2 md:order-1"
        >

          {/* Short & crisp in Merriweather + Merriweather Sans */}
          <h1 className={`${merriweather.className} text-5xl md:text-6xl leading-tight tracking-wide`}>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-300 via-indigo-300 to-fuchsia-300">
              Balance your Karma
            </span>
            <span className={`${merriweatherSans.className} block text-4xl md:text-5xl mt-2 text-sky-200/95`}>
              Align your Life
            </span>
          </h1>

          <p className={`${merriweatherSans.className} mt-5 max-w-xl text-slate-300/95 text-sm md:text-base font-medium`}>
            Submit your birth details to begin.
          </p>

          <BirthForm />
        </motion.div>

        {/* Right column — Rotating Zodiac Wheel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="order-1 md:order-2 relative"
        >
          <div className="relative mx-auto aspect-square w-[90%] max-w-[640px]">
            {/* Glow */}
            <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_50%,#8ecbff22,transparent_60%)]" />

            {/* Slowly rotating wheel with hover-to-pause */}
            <img
              src={wheelSrc}
              alt="Zodiac Wheel"
              onMouseEnter={() => setWheelPaused(true)}
              onMouseLeave={() => setWheelPaused(false)}
              style={{ animation: "spin_slow_90s 90s linear infinite", animationPlayState: wheelPaused ? "paused" : "running" }}
              className="relative z-10 h-full w-full select-none rounded-full opacity-95 will-change-transform"
              draggable={false}
            />

            {/* Silhouette / horizon accent */}
            <div className="absolute bottom-8 left-1/2 z-0 h-24 w-24 -translate-x-1/2 rounded-full bg-black/50 blur-2xl" />
          </div>

          {/* Small ambient bodies */}
          <AmbientBodies />
        </motion.div>
      </section>

      <style>{`
        @keyframes spin_slow_90s { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
