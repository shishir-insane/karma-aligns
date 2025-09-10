"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * Draws Saptarishi (Ursa Major / Big Dipper) as a small constellation overlay
 * in the top-left of the viewport, with a subtle animated "shooting star"
 * traversing the polyline.
 */
export default function ConstellationOverlay() {
  // Container size (in px) for the constellation card
  const width = 440;  // w ~ 28rem
  const height = 280; // h ~ 17.5rem

  // Approximate normalized points of the Big Dipper (0..1, left-to-right)
  const pts = useMemo(
    () =>
      [
        [0.05, 0.20], // Alkaid
        [0.18, 0.28], // Mizar
        [0.28, 0.32], // Alioth
        [0.40, 0.30], // Megrez
        [0.52, 0.25], // Phecda
        [0.65, 0.23], // Merak
        [0.85, 0.16], // Dubhe
      ] as [number, number][],
    []
  );

  // Precompute segment lengths for animation along the path
  const segs = useMemo(() => {
    const abs = pts.map(([x, y]) => [x * width, y * height] as [number, number]);
    const out: { a: [number, number]; b: [number, number]; len: number }[] = [];
    for (let i = 0; i < abs.length - 1; i++) {
      const a = abs[i];
      const b = abs[i + 1];
      const dx = b[0] - a[0];
      const dy = b[1] - a[1];
      out.push({ a, b, len: Math.hypot(dx, dy) });
    }
    const total = out.reduce((s, e) => s + e.len, 0) || 1;
    return { segs: out, total };
  }, [pts, width, height]);

  const [t, setT] = useState(0); // 0..1 progress along path

  useEffect(() => {
    let raf = 0;
    let start = performance.now();
    const duration = 9000; // slower animation

    const tick = (now: number) => {
      const d = (now - start) % duration;
      setT(d / duration);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Interpolate the moving "shooting star" point along the polyline
  function pointAt(p: number): [number, number] {
    const L = segs.total * p;
    let acc = 0;
    for (const s of segs.segs) {
      if (acc + s.len >= L) {
        const u = (L - acc) / s.len;
        const x = s.a[0] + (s.b[0] - s.a[0]) * u;
        const y = s.a[1] + (s.b[1] - s.a[1]) * u;
        return [x, y];
      }
      acc += s.len;
    }
    const last = segs.segs[segs.segs.length - 1];
    return last ? last.b : [0, 0];
  }

  const star = pointAt(t);
  const trail = pointAt(Math.max(0, t - 0.03));

  // SVG path string
  const pathD = useMemo(() => {
    const abs = pts.map(([x, y]) => [x * width, y * height] as [number, number]);
    return abs.reduce((d, [x, y], i) => (i === 0 ? `M${x},${y}` : `${d} L${x},${y}`), "");
  }, [pts, width, height]);

  return (
    <div className="pointer-events-none absolute left-0 top-0 z-10" style={{ width, height }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none">
        {/* constellation glow */}
        <path d={pathD} stroke="rgba(148,163,184,0.25)" strokeWidth="2" />
        <path d={pathD} stroke="url(#gradLine)" strokeWidth="1.5" strokeDasharray="6 6" />
        <defs>
          <linearGradient id="gradLine" x1="0" y1="0" x2={width} y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="rgba(125,211,252,0.6)" />
            <stop offset="100%" stopColor="rgba(244,114,182,0.6)" />
          </linearGradient>
        </defs>

        {/* stars */}
        {pts.map(([x, y], i) => {
          const px = x * width;
          const py = y * height;
          return (
            <g key={i}>
              <circle cx={px} cy={py} r="2.5" fill="white" opacity="0.9" />
              <circle cx={px} cy={py} r="6" fill="url(#starGlow)" opacity="0.35" />
            </g>
          );
        })}
        <defs>
          <radialGradient id="starGlow">
            <stop offset="0%" stopColor="white" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* shooting star (trail + head) */}
        <line
          x1={trail[0]} y1={trail[1]}
          x2={star[0]} y2={star[1]}
          stroke="rgba(165,243,252,0.8)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx={star[0]} cy={star[1]} r="3.5" fill="white" />
      </svg>
    </div>
  );
}