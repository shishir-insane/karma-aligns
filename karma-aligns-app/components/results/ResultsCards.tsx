"use client";

import React, { useMemo } from "react";
import { Merriweather_Sans } from "next/font/google";
const merriweatherSans = Merriweather_Sans({ subsets: ["latin"], weight: ["400","700"], display: "swap" });

export type Placement = {
  planet: string;
  degree: string;
  degreeNum: number;
  house: number;
  nakshatra: string;
  nakshatraLord: string;
  nakshatraPada: number;
  sign: string;
  signLord: string;
  retrograde: boolean;
  symbol: string;
};

export default function ResultsCards({
  rows,
  chartId,
  params,
}: {
  rows: Placement[];
  chartId: string | null;
  params: { dob: string; tob: string; tz: string; lat: string; lon: string; varsha_year: string };
}) {
  const sun = rows.find((r) => r.planet === "Sun");
  const moon = rows.find((r) => r.planet === "Moon");

  const bySign = useMemo(() => {
    const m = new Map<string, Placement[]>();
    for (const r of rows) (m.get(r.sign) ?? m.set(r.sign, []).get(r.sign)!).push(r);
    return [...m.entries()].sort((a,b) => b[1].length - a[1].length);
  }, [rows]);

  const byHouse = useMemo(() => {
    const m = new Map<number, Placement[]>();
    for (const r of rows) (m.get(r.house) ?? m.set(r.house, []).get(r.house)!).push(r);
    return [...m.entries()].sort((a,b) => b[1].length - a[1].length);
  }, [rows]);

  const retrogrades = rows.filter((r) => r.retrograde);
  const topNakshatras = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of rows) m.set(r.nakshatra, (m.get(r.nakshatra) || 0) + 1);
    return [...m.entries()].sort((a,b) => b[1]-a[1]).slice(0,3);
  }, [rows]);

  return (
    <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
      {/* Snapshot */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
        <div className="text-xs text-slate-400 mb-2">Chart snapshot</div>
        <div className="text-sm text-slate-200">
          <div><span className="text-slate-400">Chart ID:</span> {chartId ? chartId.slice(0,16) + "…" : "—"}</div>
          <div className="mt-1 flex flex-wrap gap-2 text-[11px]">
            <span className="rounded-full bg-white/5 px-2 py-0.5 border border-white/10">DOB: {params.dob || "—"}</span>
            <span className="rounded-full bg-white/5 px-2 py-0.5 border border-white/10">TOB: {params.tob || "—"}</span>
            <span className="rounded-full bg-white/5 px-2 py-0.5 border border-white/10">TZ: {params.tz || "—"}</span>
            <span className="rounded-full bg-white/5 px-2 py-0.5 border border-white/10">Lat: {params.lat || "—"}</span>
            <span className="rounded-full bg-white/5 px-2 py-0.5 border border-white/10">Lon: {params.lon || "—"}</span>
            <span className="rounded-full bg-white/5 px-2 py-0.5 border border-white/10">Varsha: {params.varsha_year || "—"}</span>
          </div>
        </div>
      </div>

      {/* Luminaries */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
        <div className="text-xs text-slate-400 mb-2">Luminaries</div>
        <ul className="space-y-2 text-sm text-slate-200">
          <li>
            <strong className="text-sky-200">{sun?.symbol ?? ""} Sun</strong>
            {sun ? (
              <span className="ml-2 text-slate-300">
                {sun.sign} ({sun.degree}), House {sun.house} • {sun.nakshatra} (Pada {sun.nakshatraPada})
              </span>
            ) : <span className="ml-2 text-slate-500">Not in response</span>}
          </li>
          <li>
            <strong className="text-sky-200">{moon?.symbol ?? ""} Moon</strong>
            {moon ? (
              <span className="ml-2 text-slate-300">
                {moon.sign} ({moon.degree}), House {moon.house} • {moon.nakshatra} (Pada {moon.nakshatraPada})
              </span>
            ) : <span className="ml-2 text-slate-500">Not in response</span>}
          </li>
        </ul>
      </div>

      {/* Sign concentration */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
        <div className="text-xs text-slate-400 mb-2">Sign concentration (top)</div>
        {bySign.length === 0 ? (
          <div className="text-slate-500 text-sm">No sign data.</div>
        ) : (
          <ul className="space-y-2 text-sm">
            {bySign.slice(0,3).map(([sign, list]) => (
              <li key={sign} className="flex items-start justify-between">
                <div className="text-slate-200">{sign || "—"}</div>
                <div className="text-slate-300">
                  <span className="mr-2 rounded-full bg-white/5 px-2 py-0.5 text-[11px] border border-white/10">{list.length}</span>
                  {list.map(p => <span key={p.planet} className="ml-1">{p.symbol}</span>)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* House concentration */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
        <div className="text-xs text-slate-400 mb-2">House concentration (top)</div>
        {byHouse.length === 0 ? (
          <div className="text-slate-500 text-sm">No house data.</div>
        ) : (
          <ul className="space-y-2 text-sm">
            {byHouse.slice(0,3).map(([house, list]) => (
              <li key={house} className="flex items-start justify-between">
                <div className="text-slate-200">House {house || "—"}</div>
                <div className="text-slate-300">
                  <span className="mr-2 rounded-full bg-white/5 px-2 py-0.5 text-[11px] border border-white/10">{list.length}</span>
                  {list.map(p => <span key={p.planet} className="ml-1">{p.symbol}</span>)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Retrograde bodies */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
        <div className="text-xs text-slate-400 mb-2">Retrograde</div>
        <div className="text-sm text-slate-200">
          {retrogrades.length === 0 ? (
            <span className="text-slate-500">None.</span>
          ) : (
            <ul className="space-y-1">
              {retrogrades.map((r) => (
                <li key={r.planet}>
                  <span className="mr-2">{r.symbol}</span>
                  <strong>{r.planet}</strong> — {r.sign || "—"} ({r.degree}), House {r.house || "—"}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Nakshatra highlights */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
        <div className="text-xs text-slate-400 mb-2">Nakshatra highlights</div>
        {topNakshatras.length === 0 ? (
          <div className="text-slate-500 text-sm">No nakshatra data.</div>
        ) : (
          <ul className="space-y-2 text-sm">
            {topNakshatras.map(([name, count]) => (
              <li key={name} className="flex items-start justify-between">
                <div className="text-slate-200">{name || "—"}</div>
                <span className="rounded-full bg-white/5 px-2 py-0.5 text-[11px] border border-white/10">{count}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
