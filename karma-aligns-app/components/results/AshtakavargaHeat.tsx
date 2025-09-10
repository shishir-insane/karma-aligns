"use client";

import React from "react";

export type AshtakaData = {
  sav?: number[] | null;                 // 12-sign Sarva Ashtakavarga
  pav?: Record<string, number[]> | null; // Planetary Ashtakavarga: planet -> 12-sign array
};

const SIGNS = ["Ar","Ta","Ge","Cn","Le","Vi","Li","Sc","Sg","Cp","Aq","Pi"];

export default function AshtakavargaHeat({ data }: { data: AshtakaData }) {
  const pav = data?.pav ?? {};
  const sav = data?.sav ?? null;
  const planets = Object.keys(pav);

  if (!planets.length && !sav) {
    return (
      <div className="ka-card p-4 text-sm text-slate-500">
        No Aṣṭakavarga data.
      </div>
    );
  }

  return (
    <div className="ka-card p-4 overflow-x-auto">
      <table className="text-xs">
        <thead>
          <tr>
            <th className="px-2 py-1 text-left">Planet</th>
            {SIGNS.map((s) => (
              <th key={s} className="px-2 py-1 text-center">{s}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {planets.map((pl) => {
            const arr = pav[pl] || [];
            return (
              <tr key={pl} className="border-t border-white/10">
                <td className="px-2 py-1 font-medium text-slate-200">{pl}</td>
                {SIGNS.map((_, idx) => {
                  const v = arr[idx] ?? 0;               // typical PAV values: 0–8
                  const intensity = Math.min(1, v / 8);  // normalize for heat
                  return (
                    <td key={idx} className="px-2 py-1">
                      <div
                        className="mx-auto h-5 w-6 rounded-sm"
                        style={{ background: `rgba(125,211,252,${0.15 + intensity * 0.6})` }}
                        title={`${pl} • ${SIGNS[idx]}: ${v}`}
                      >
                        <div className="text-center leading-5 text-[10px]">{v}</div>
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}

          {sav && (
            <tr className="border-t border-white/10">
              <td className="px-2 py-1 text-sky-200">SAV</td>
              {SIGNS.map((_, idx) => {
                const v = sav[idx] ?? 0;                // typical SAV values: ~20–45
                const intensity = Math.min(1, v / 40);  // rough normalization
                return (
                  <td key={idx} className="px-2 py-1">
                    <div
                      className="mx-auto h-5 w-6 rounded-sm"
                      style={{ background: `rgba(244,114,182,${0.12 + intensity * 0.6})` }}
                      title={`SAV • ${SIGNS[idx]}: ${v}`}
                    >
                      <div className="text-center leading-5 text-[10px]">{v}</div>
                    </div>
                  </td>
                );
              })}
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
