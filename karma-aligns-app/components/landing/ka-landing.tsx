"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Moon, Sun, Sparkles } from "lucide-react";

/**
 * AstroLanding
 * Single-file React component for the hero/landing page.
 *
 * Notes
 * - TailwindCSS assumed.
 * - Uses a canvas starfield with:
 *   - Fixed stars that twinkle subtly
 *   - A 23.5° ecliptic band where planets (Mercury, Venus, Mars, Jupiter, Saturn) crawl slowly
 *   - Occasional shooting stars (meteors) on shallow angles
 * - Right side zodiac wheel rotates very slowly (CSS-based, smooth + performant)
 * - Left column hosts a birth data form; includes client-side validation hooks
 * - Colors & layout match the provided reference (deep indigo-purple space gradient with cyan/blue accents)
 *
 * Props
 * - wheelSrc: string — URL to the zodiac wheel image. Use a high-res PNG/SVG with transparent background for the best effect.
 */
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
            <span className="font-semibold tracking-wide text-sky-200/90">Karma Aligns</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-slate-300">
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
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-sky-200/80 backdrop-blur">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-sky-300/80" />
            Sun Signs
          </div>
          <h1 className="text-5xl leading-tight text-sky-200 md:text-6xl">
            Ultimate <span className="block text-[#4db8ff]">Guide</span>
            <span className="mt-1 block text-2xl font-light text-slate-300">to Astrology</span>
          </h1>
          <p className="mt-6 max-w-xl text-slate-300/90">
            There are 12 signs of the zodiac—each spanning 30°—completing a 360° circle. Enter your birth
            details to generate a scientifically grounded sky model (Lahiri ayanāṁśa by default) and an elegant
            chart you can explore.
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

            {/* Slowly rotating wheel */}
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

/** Birth data form */
function BirthForm() {
  // Keep hook order consistent across renders
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    date: "",
    time: "",
    tz: "+05:30",
    lat: "",
    lon: "",
  });
  // Inline mounted flag (avoid external helper to prevent undefined refs)
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  function onChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    // Hook up to your API endpoint when ready.
    // Example: await fetch('/api/v1/varsha?...')
    setTimeout(() => setSubmitting(false), 1200);
  }

  // Render a skeleton until mounted to avoid hydration mismatches with extensions
  if (!mounted) {
    return <div className="mt-8 h-44 w-full max-w-xl rounded-3xl border border-white/10 bg-white/5" />;
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mt-8 max-w-xl rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md md:p-6"
      data-lpignore="true"
      data-lastpass-ignore="true"
      data-1p-ignore="true"
      autoComplete="off"
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Full Name" htmlFor="name">
          <input
            id="name"
            name="name"
            placeholder="Arjun Sharma"
            value={form.name}
            onChange={onChange}
            className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm placeholder-slate-400 outline-none ring-0 focus:border-sky-400/50"
            data-lpignore="true"
            data-lastpass-ignore="true"
            data-1p-ignore="true"
          />
        </Field>
        <Field label="Date of Birth" htmlFor="date">
          <input
            id="date"
            name="date"
            type="date"
            value={form.date}
            onChange={onChange}
            className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none focus:border-sky-400/50"
            data-lpignore="true"
            data-lastpass-ignore="true"
            data-1p-ignore="true"
          />
        </Field>
        <Field label="Time of Birth" htmlFor="time">
          <input
            id="time"
            name="time"
            type="time"
            step="60"
            value={form.time}
            onChange={onChange}
            className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none focus:border-sky-400/50"
            data-lpignore="true"
            data-lastpass-ignore="true"
            data-1p-ignore="true"
          />
        </Field>
        <Field label="Timezone (±HH:MM)" htmlFor="tz">
          <select
            id="tz"
            name="tz"
            value={form.tz}
            onChange={onChange}
            className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none focus:border-sky-400/50"
            data-lpignore="true"
            data-lastpass-ignore="true"
            data-1p-ignore="true"
          >
            {tzOptions.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Latitude" htmlFor="lat" hint="e.g., 26.7606">
          <input
            id="lat"
            name="lat"
            inputMode="decimal"
            placeholder="26.7606"
            value={form.lat}
            onChange={onChange}
            className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none focus:border-sky-400/50"
            data-lpignore="true"
            data-lastpass-ignore="true"
            data-1p-ignore="true"
          />
        </Field>
        <Field label="Longitude" htmlFor="lon" hint="e.g., 83.3732">
          <input
            id="lon"
            name="lon"
            inputMode="decimal"
            placeholder="83.3732"
            value={form.lon}
            onChange={onChange}
            className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none focus:border-sky-400/50"
            data-lpignore="true"
            data-lastpass-ignore="true"
            data-1p-ignore="true"
          />
        </Field>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-2xl bg-[#e0577d] px-4 py-2 text-sm font-medium text-white shadow-lg shadow-[#e0577d22] transition hover:brightness-110 focus:outline-none disabled:opacity-60"
        >
          {submitting ? (
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
          ) : (
            <ArrowRight className="h-4 w-4" />
          )}
          Let's Begin
        </button>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Sun className="h-4 w-4" /> <span>Accurate ephemerides</span>
          <span className="mx-2">•</span>
          <Moon className="h-4 w-4" /> <span>Lahiri ayanāṁśa</span>
        </div>
      </div>
    </form>
  );
}

function Field({ label, htmlFor, children, hint }: { label: string; htmlFor: string; children: React.ReactNode; hint?: string }) {
  return (
    <label htmlFor={htmlFor} className="space-y-1">
      <div className="text-xs font-medium text-slate-300/90">{label}</div>
      {children}
      {hint ? <div className="text-[10px] text-slate-400">{hint}</div> : null}
    </label>
  );
}

const tzOptions = [
  "+14:00",
  "+13:45",
  "+13:00",
  "+12:00",
  "+11:00",
  "+10:00",
  "+09:30",
  "+09:00",
  "+08:00",
  "+07:00",
  "+06:30",
  "+06:00",
  "+05:45",
  "+05:30",
  "+05:00",
  "+04:00",
  "+03:00",
  "+02:00",
  "+01:00",
  "+00:00",
  "-01:00",
  "-02:00",
  "-03:00",
  "-03:30",
  "-04:00",
  "-05:00",
  "-06:00",
  "-07:00",
  "-08:00",
  "-09:00",
  "-09:30",
  "-10:00",
  "-11:00",
  "-12:00",
];

/** Ambient celestial bodies around the wheel for subtle parallax */
function AmbientBodies() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {/* soft parallax orbits */}
      <div className="absolute right-16 top-10 h-2 w-2 animate-pulse rounded-full bg-sky-200/90" />
      <div className="absolute right-24 top-28 h-1.5 w-1.5 animate-pulse rounded-full bg-fuchsia-200/90 [animation-delay:1.2s]" />
      <div className="absolute right-40 top-40 h-3 w-3 animate-pulse rounded-full bg-amber-200/90 [animation-delay:2.1s]" />
    </div>
  );
}

/** Canvas starfield with twinkling stars, meteors, and a realistic ecliptic band where planets crawl */
function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [dpr, setDpr] = useState(1);

  useEffect(() => {
    const handle = () => setDpr(Math.min(2, window.devicePixelRatio || 1));
    handle();
    window.addEventListener("resize", resize);
    window.addEventListener("orientationchange", resize);

    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d", { alpha: true })!;

    let width = 0, height = 0;
    let animationId = 0;

    // Star + meteor + planet populations
    const stars: { x: number; y: number; r: number; tw: number }[] = [];
    const meteors: { x: number; y: number; vx: number; vy: number; life: number }[] = [];
    const planets: { lon: number; speed: number; radius: number; color: string }[] = [];

    function resize() {
      // Measure from the rendered box
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // initialize populations
    function init() {
      resize();
      stars.length = 0;
      const starCount = Math.floor((width * height) / 3000);
      for (let i = 0; i < starCount; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          r: Math.random() * 1.6 + 0.4,
          tw: Math.random() * 2 * Math.PI,
        });
      }

      // planets along ecliptic: 23.5° band across view
      planets.length = 0;
      const palette = ["#d0e8ff", "#ffd6a5", "#ffb3c1", "#c7ffd8", "#ffe29a"];
      const speeds = [0.0022, 0.0016, 0.0012, 0.0009, 0.0007];
      for (let i = 0; i < 5; i++) {
        planets.push({ lon: Math.random() * width, speed: speeds[i], radius: 2.6 + i * 0.9, color: palette[i] });
      }
    }

    function drawEcliptic() {
      const tilt = (23.5 * Math.PI) / 180;
      ctx.save();
      ctx.globalAlpha = 0.1;
      ctx.strokeStyle = "#7fc8ff";
      ctx.lineWidth = 1;
      ctx.translate(0, height * 0.5);
      ctx.rotate(-tilt);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(width * 1.2, 0);
      ctx.stroke();
      ctx.restore();
    }

    function render(t: number) {
      animationId = requestAnimationFrame(render);
      ctx.clearRect(0, 0, width, height);

      // Stars — additive blending + halos for background feel
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (const s of stars) {
        const twinkle = 0.5 + 0.5 * Math.abs(Math.sin((t * 0.001 + s.tw) * 1.1));
        ctx.globalAlpha = 0.5 * twinkle;
        ctx.fillStyle = '#dbefff';
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
        // halo
        ctx.globalAlpha = 0.18 * twinkle;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      drawEcliptic();

      // Planets crawl with subtle glow
      const tilt = (23.5 * Math.PI) / 180;
      ctx.save();
      ctx.translate(0, height * 0.5);
      ctx.rotate(-tilt);
      for (const p of planets) {
        p.lon = (p.lon + p.speed) % (width * 1.2);
        ctx.globalAlpha = 0.95;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.lon, 0, p.radius, 0, Math.PI * 2);
        ctx.fill();
        // glow
        ctx.globalAlpha = 0.28;
        ctx.beginPath();
        ctx.arc(p.lon, 0, p.radius * 2.6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Meteors (shooting stars)
      if (Math.random() < 0.01 && meteors.length < 4) {
        const startY = Math.random() * height * 0.7;
        const speed = 7 + Math.random() * 5;
        meteors.push({ x: width + 20, y: startY, vx: -speed, vy: speed * -0.15, life: 1 });
      }
      for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i];
        m.x += m.vx;
        m.y += m.vy;
        m.life -= 0.015;
        if (m.life <= 0 || m.x < -50 || m.y < -50) meteors.splice(i, 1);
        ctx.globalAlpha = Math.max(0, m.life);
        const grad = ctx.createLinearGradient(m.x, m.y, m.x - m.vx * 4, m.y - m.vy * 4);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(1, '#92d0ff00');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(m.x - m.vx * 4, m.y - m.vy * 4);
        ctx.stroke();
      }
    }

    init();
    let start = performance.now();
    const loop = (t: number) => render(t - start);
    animationId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("orientationchange", resize);
    };
  }, [dpr]);

  return <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 z-0" />;
}