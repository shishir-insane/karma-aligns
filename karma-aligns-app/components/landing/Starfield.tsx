"use client";

import React, { useEffect, useRef, useState } from "react";

export default function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [dpr, setDpr] = useState(1);

  useEffect(() => {
    const updateDpr = () => setDpr(Math.min(2, window.devicePixelRatio || 1));
    updateDpr();

    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d", { alpha: true })!;

    let width = 0, height = 0;
    let animationId = 0;

    type Star = { x: number; y: number; r: number; tw: number };
    type Pt = { x: number; y: number };
    type Seg = { a: Pt; b: Pt; len: number };
    type Crater = { u: number; v: number; s: number; a: number };

    const stars: Star[] = [];
    const meteors: { x: number; y: number; vx: number; vy: number; life: number }[] = [];
    const planets: { lon: number; speed: number; radius: number; color: string }[] = [];

    // Constellation (Ursa Major / Big Dipper) at TOP-LEFT
    let constelPts: Pt[] = [];
    let constelSegs: Seg[] = [];
    let constelTotalLen = 0;

    // Elegant Moon state (base position + crater map)
    const moon = {
      baseX: 0,
      baseY: 0,
      r: 32,
      craters: [] as Crater[],
    };

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.style.width = `100vw`;
      canvas.style.height = `100vh`;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function pushStar(x: number, y: number, rMin = 0.25, rMax = 1.0) {
      stars.push({
        x,
        y,
        r: rMin + Math.random() * (rMax - rMin),
        tw: Math.random() * 2 * Math.PI,
      });
    }

    function buildConstellation() {
      const anchorsN: [number, number][] = [
        [0.08, 0.10],
        [0.105, 0.12],
        [0.13, 0.115],
        [0.16, 0.135],
        [0.19, 0.12],
        [0.215, 0.10],
        [0.24, 0.09],
      ];
      constelPts = anchorsN.map(([nx, ny]) => ({ x: nx * width, y: ny * height }));
      constelSegs = [];
      constelTotalLen = 0;
      for (let i = 0; i < constelPts.length - 1; i++) {
        const a = constelPts[i], b = constelPts[i + 1];
        const dx = b.x - a.x, dy = b.y - a.y;
        const len = Math.hypot(dx, dy);
        constelSegs.push({ a, b, len });
        constelTotalLen += len;
      }
    }

    function buildMoon() {
      moon.r = Math.max(20, Math.min(48, width * 0.026));
      moon.baseX = width * 0.82;
      moon.baseY = height * 0.18;

      // Stable set of small craters (relative to radius)
      moon.craters = [];
      const N = 18;
      for (let i = 0; i < N; i++) {
        const ang = Math.random() * Math.PI * 2;
        const dist = Math.pow(Math.random(), 0.65) * 0.78;
        const u = Math.cos(ang) * dist;
        const v = Math.sin(ang) * dist;
        const s = 0.05 + Math.random() * 0.11;
        const a = 0.12 + Math.random() * 0.18;
        moon.craters.push({ u, v, s, a });
      }
    }

    function init() {
      resize();

      // ==== Reduced star density & size (unchanged) ====
      stars.length = 0;
      const baseCount = Math.floor((width * height) / 4500);
      for (let i = 0; i < baseCount; i++) {
        pushStar(Math.random() * width, Math.random() * height, 0.25, 1.0);
      }
      const topExtra = Math.floor(width / 6);
      for (let i = 0; i < topExtra; i++) {
        pushStar(Math.random() * width, Math.random() * (height * 0.12), 0.25, 0.9);
      }
      const midExtra = Math.floor(width / 7);
      for (let i = 0; i < midExtra; i++) {
        const y = height * (0.47 + Math.random() * 0.06);
        pushStar(Math.random() * width, y, 0.28, 1.0);
      }

      // ==== Planets along the ecliptic (visual) ====
      planets.length = 0;
      const palette = ["#d0e8ff", "#ffd6a5", "#ffb3c1", "#c7ffd8", "#ffe29a"];
      const speeds = [0.0022, 0.0016, 0.0012, 0.0009, 0.0007];
      for (let i = 0; i < 5; i++) {
        planets.push({ lon: Math.random() * width, speed: speeds[i], radius: 2.6 + i * 0.8, color: palette[i] });
      }

      buildConstellation();
      buildMoon();
    }

    function drawEcliptic() {
      const tilt = (23.5 * Math.PI) / 180;
      ctx.save();
      ctx.globalAlpha = 0.08;
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

    // ---- Elegant Moon (slower drift & phase) ----
    function drawMoon(t: number) {
      const r = moon.r;
      // ⬇️ reduced drift speed
      const cx = moon.baseX + Math.sin(t * 0.00008) * 6; // was 0.0002 * 8
      const cy = moon.baseY + Math.cos(t * 0.00010) * 3; // was 0.00025 * 4

      // Outer halo
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const gHalo = ctx.createRadialGradient(cx, cy, r * 0.6, cx, cy, r * 3.2);
      gHalo.addColorStop(0, "rgba(240,245,255,0.16)");
      gHalo.addColorStop(1, "rgba(240,245,255,0)");
      ctx.fillStyle = gHalo;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Disc
      const gDisc = ctx.createRadialGradient(cx - r * 0.2, cy - r * 0.22, r * 0.3, cx, cy, r);
      gDisc.addColorStop(0, "#f8fbff");
      gDisc.addColorStop(1, "#c8d1e0");
      ctx.save();
      ctx.fillStyle = gDisc;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      // Craters
      ctx.save();
      ctx.clip();
      for (const c of moon.craters) {
        const x = cx + c.u * r;
        const y = cy + c.v * r;
        const cr = c.s * r;
        const cg = ctx.createRadialGradient(x - cr * 0.2, y - cr * 0.2, cr * 0.2, x, y, cr);
        cg.addColorStop(0, `rgba(95,110,135,${c.a * 0.7})`);
        cg.addColorStop(1, `rgba(95,110,135,0)`);
        ctx.fillStyle = cg;
        ctx.beginPath();
        ctx.arc(x, y, cr, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = c.a * 0.5;
        ctx.strokeStyle = "rgba(245,250,255,0.35)";
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.arc(x - cr * 0.15, y - cr * 0.15, cr * 0.9, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();

      // ⬇️ slower phase animation
      const phase = 0.40 + 0.10 * Math.sin(t * 0.00005); // was 0.00015
      const shadowOffset = (0.6 - phase) * r * 1.25;
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "rgba(12,16,30,0.50)";
      ctx.beginPath();
      ctx.arc(cx + shadowOffset, cy, r * 1.02, 0, Math.PI * 2);
      ctx.fill();

      // Rim light
      const rim = ctx.createRadialGradient(cx, cy, r * 0.95, cx, cy, r * 1.2);
      rim.addColorStop(0, "rgba(255,255,255,0.0)");
      rim.addColorStop(1, "rgba(255,255,255,0.35)");
      ctx.strokeStyle = rim;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    }

    // ---- Constellation drawing + shooting star along points (slower) ----
    function pointAtDistance(d: number): Pt {
      let dist = d % constelTotalLen;
      for (const seg of constelSegs) {
        if (dist <= seg.len) {
          const u = seg.len === 0 ? 0 : dist / seg.len;
          return { x: seg.a.x + (seg.b.x - seg.a.x) * u, y: seg.a.y + (seg.b.y - seg.a.y) * u };
        }
        dist -= seg.len;
      }
      const last = constelSegs[constelSegs.length - 1];
      return { x: last.b.x, y: last.b.y };
    }

    function drawConstellation(t: number) {
      if (constelPts.length < 2) return;

      // Base faint path
      ctx.save();
      ctx.globalAlpha = 0.18;
      ctx.strokeStyle = "#b5e3ff";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(constelPts[0].x, constelPts[0].y);
      for (let i = 1; i < constelPts.length; i++) ctx.lineTo(constelPts[i].x, constelPts[i].y);
      ctx.stroke();
      ctx.restore();

      // ⬇️ slower dashed motion
      const dashLen = 8, gapLen = 10;
      const dashOffset = -((t * 0.05) % (dashLen + gapLen)); // was 0.12
      ctx.save();
      ctx.globalAlpha = 0.7;
      ctx.strokeStyle = "#cfe9ff";
      ctx.lineWidth = 1.4;
      ctx.setLineDash([dashLen, gapLen]);
      ctx.lineDashOffset = dashOffset;
      ctx.beginPath();
      ctx.moveTo(constelPts[0].x, constelPts[0].y);
      for (let i = 1; i < constelPts.length; i++) ctx.lineTo(constelPts[i].x, constelPts[i].y);
      ctx.stroke();
      ctx.restore();

      // Node stars
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (const p of constelPts) {
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = "#eaf5ff";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 0.22;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // ⬇️ slower shooting star along the constellation path
      const speed = 45; // px/s (was 90)
      const headDist = (t * 0.001 * speed) % constelTotalLen;
      const tailLen = 36;
      const tailDist = (headDist - tailLen + constelTotalLen) % constelTotalLen;

      const head = pointAtDistance(headDist);
      const tail = pointAtDistance(tailDist);

      const grad = ctx.createLinearGradient(head.x, head.y, tail.x, tail.y);
      grad.addColorStop(0, "rgba(255,255,255,0.95)");
      grad.addColorStop(1, "rgba(146,208,255,0.0)");
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(head.x, head.y);
      ctx.lineTo(tail.x, tail.y);
      ctx.stroke();

      // Head glow
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(head.x, head.y, 1.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = 0.25;
      ctx.beginPath();
      ctx.arc(head.x, head.y, 5.0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.setLineDash([]);
      ctx.lineDashOffset = 0;
    }

    function render(t: number) {
      animationId = requestAnimationFrame(render);
      ctx.clearRect(0, 0, width, height);

      // Stars
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (const s of stars) {
        const twinkle = 0.55 + 0.45 * Math.abs(Math.sin((t * 0.001 + s.tw) * 1.1));
        ctx.globalAlpha = 0.45 * twinkle;
        ctx.fillStyle = "#dbefff";
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 0.12 * twinkle;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * 2.0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      drawEcliptic();

      // Planets on ecliptic
      const tilt = (23.5 * Math.PI) / 180;
      ctx.save();
      ctx.translate(0, height * 0.5);
      ctx.rotate(-tilt);
      for (const p of planets) {
        p.lon = (p.lon + p.speed) % (width * 1.2);

        ctx.globalAlpha = 0.9;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.lon, 0, p.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 0.22;
        ctx.beginPath();
        ctx.arc(p.lon, 0, p.radius * 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Elegant Moon (slower)
      drawMoon(t);

      // Ursa Major with slower path animations
      drawConstellation(t);

      // Ambient random meteors (unchanged)
      if (Math.random() < 0.008 && meteors.length < 3) {
        const startY = Math.random() * height * 0.7;
        const speed = 6 + Math.random() * 4;
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
        grad.addColorStop(0, "#ffffff");
        grad.addColorStop(1, "#92d0ff00");
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(m.x - m.vx * 4, m.y - m.vy * 4);
        ctx.stroke();
      }
    }

    // Properly removable listeners
    const onResize = () => { resize(); buildConstellation(); buildMoon(); };
    const onOrient = () => { resize(); buildConstellation(); buildMoon(); };
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onOrient);

    init();
    let start = performance.now();
    const loop = (t: number) => render(t - start);
    animationId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onOrient);
    };
  }, [dpr]);

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-0" />;
}
