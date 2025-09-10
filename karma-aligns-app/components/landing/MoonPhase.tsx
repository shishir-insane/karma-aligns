"use client";

import React from "react";

export default function MoonPhase({ className = "", size = 64 }: { className?: string; size?: number }) {
  // We simulate phases by sliding a circular "terminator" mask across a lit disc.
  // Period is slowed for UX; respects prefers-reduced-motion.
  return (
    <div className={className} style={{ width: size, height: size }}>
      <div className="relative" style={{ width: size, height: size }}>
        {/* glow */}
        <div
          className="absolute inset-0 rounded-full"
          style={{ background: "radial-gradient(closest-side, rgba(255,255,255,0.9), rgba(255,255,255,0.0) 70%)", filter: "blur(1px)" }}
        />
        {/* lit disc */}
        <div className="absolute inset-0 rounded-full bg-white/95" />
        {/* moving shadow (crescent/gibbous) */}
        <div
          className="absolute inset-0 rounded-full bg-[#0b1020]"
          style={{
            // The shadow is another circle that slides across on the X axis.
            mixBlendMode: "multiply",
            animation: "ka_lunar 24s ease-in-out infinite",
            WebkitMaskImage: "radial-gradient(circle at center, black 60%, transparent 62%)",
            maskImage: "radial-gradient(circle at center, black 60%, transparent 62%)",
          }}
        />
      </div>

      <style jsx>{`
        @keyframes ka_lunar {
          0%   { transform: translateX(-45%); opacity: 1; }
          25%  { transform: translateX(0%);   opacity: 0.9; }   /* first quarter */
          50%  { transform: translateX(45%);  opacity: 1; }     /* full to waning */
          75%  { transform: translateX(0%);   opacity: 0.9; }   /* last quarter */
          100% { transform: translateX(-45%); opacity: 1; }     /* new (loop) */
        }
        @media (prefers-reduced-motion: reduce) {
          div[style*="ka_lunar"] { animation-duration: 0s !important; }
        }
      `}</style>
    </div>
  );
}
