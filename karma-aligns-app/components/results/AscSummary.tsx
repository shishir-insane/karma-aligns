"use client";

import React from "react";
import { SIGNS, signFromLon, degInSign, fmtDeg } from "./astro-utils";

export default function AscSummary({
  ascIdx,
  ascLon,
  cusps,
}: {
  ascIdx: number | null;
  ascLon: number | null;
  cusps: number[];
}) {
  const idxFromLon = signFromLon(ascLon ?? undefined);
  const idx = typeof ascIdx === "number" ? ascIdx : idxFromLon;
  const label = typeof idx === "number" ? SIGNS[idx] : "—";

  const within = typeof ascLon === "number" ? degInSign(ascLon).within : null;

  return (
    <section className="grid grid-cols-1 gap-5 md:grid-cols-3">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
        <div className="text-xs text-slate-400 mb-2">Ascendant</div>
        <div className="text-lg text-sky-200">
          {label}
          <span className="ml-2 text-slate-300">
            {within != null ? `(${within.toFixed(2)}°)` : ""}
          </span>
        </div>
        {typeof ascLon === "number" && (
          <div className="mt-1 text-sm text-slate-300">Ecliptic: {ascLon.toFixed(3)}°</div>
        )}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
        <div className="text-xs text-slate-400 mb-2">House 1 cusp</div>
        <div className="text-sm text-slate-200">
          {Array.isArray(cusps) && cusps[0] != null ? (
            <>
              {fmtDeg(cusps[0])} — <span className="text-slate-300">{SIGNS[signFromLon(cusps[0]) ?? 0]}</span>
            </>
          ) : "—"}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
        <div className="text-xs text-slate-400 mb-2">Cusps summary</div>
        <div className="text-sm text-slate-300">
          {Array.isArray(cusps) && cusps.length === 12 ? "12 houses computed" : "Unavailable"}
        </div>
      </div>
    </section>
  );
}
