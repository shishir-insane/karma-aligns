"use client";
import * as React from "react";

/** Faint sparkle overlay; place inside a relatively-positioned parent */
export default function Sparkles({
  show,
  burstKey,
  count = 16,
}: {
  show: boolean;
  burstKey?: number;   
  count?: number;      
}) {
  if (!show) return null;
  return (
    <div key={burstKey} className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="absolute size-1.5 rounded-full bg-white/70"
          style={{
            left: `${(i * 61) % 100}%`,
            top: `${(i * 37) % 100}%`,
            animation: `sparkle ${800 + (i % 5) * 120}ms ease-out ${i * 40}ms forwards`,
            opacity: 0,
            filter: "drop-shadow(0 0 8px rgba(255,255,255,.45))",
          }}
        />
      ))}
      <style jsx>{`
        @keyframes sparkle {
          0%   { transform: translateY(6px) scale(.6); opacity: 0; }
          30%  { opacity: .9; }
          100% { transform: translateY(-10px) scale(1); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
