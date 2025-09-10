"use client";

import React, { useMemo, useState } from "react";

export type PanchangaData = {
  weekday?: string;
  tithi?: { name?: string; progress?: number };
  yoga?: { name?: string; progress?: number };
  karana?: { name?: string };
  nakshatra?: { name?: string; pada?: number; lord?: string };
};

function Meter({ value, label }: { value: number | undefined; label: string }) {
  const pct = Math.max(0, Math.min(100, Math.round((value ?? 0) * 100)));
  return (
    <div>
      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
        <span>{label}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-sky-300/80 to-fuchsia-300/80"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function Panchanga({ data }: { data: PanchangaData }) {
  const [showInfo, setShowInfo] = useState(false);

  const weekday = data.weekday || "—";
  const tithiName = data.tithi?.name || "—";
  const tithiProg = data.tithi?.progress;
  const yogaName = data.yoga?.name || "—";
  const yogaProg = data.yoga?.progress;
  const karanaName = data.karana?.name || "—";

  const nakName = data.nakshatra?.name || "—";
  const nakPada = data.nakshatra?.pada;
  const nakLord = (data.nakshatra as any)?.lord || (data.nakshatra as any)?.lird || "—";

  const infoText = useMemo(
    () =>
      "Pañcāṅga snapshot combines Tithi (lunar day), Nakshatra (lunar mansion), Yoga, Karana, and weekday. Progress shows how far the current Tithi/Yoga has elapsed.",
    [],
  );

  return (
    <section className="ka-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <h2 className="text-sky-200 text-xl">Pañcāṅga today</h2>
        <button
          className="ml-auto rounded-full border border-white/10 bg-white/10 px-2 py-0.5 text-[11px] text-slate-200 hover:bg-white/20"
          onClick={() => setShowInfo((s) => !s)}
        >
          {showInfo ? "Hide" : "What’s this?"}
        </button>
      </div>

      {showInfo && (
        <p className="mb-4 text-xs text-slate-300">{infoText}</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Weekday + Karana */}
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <div className="text-xs text-slate-400 mb-2">Weekday</div>
          <div className="text-lg text-slate-100">{weekday}</div>
          <div className="mt-4 text-xs text-slate-400 mb-1">Karana</div>
          <div className="text-sm text-slate-200">{karanaName}</div>
        </div>

        {/* Tithi (with progress) */}
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <div className="text-xs text-slate-400 mb-2">Tithi</div>
          <div className="text-lg text-slate-100">{tithiName}</div>
          <div className="mt-3">
            <Meter value={tithiProg} label="Progress" />
          </div>
        </div>

        {/* Nakshatra */}
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <div className="text-xs text-slate-400 mb-2">Nakshatra</div>
          <div className="text-lg text-slate-100">
            {nakName} {nakPada ? <span className="text-slate-300 text-base">• Pada {nakPada}</span> : null}
          </div>
          <div className="mt-2 text-sm text-slate-300">
            Lord: <span className="text-sky-200">{nakLord}</span>
          </div>
        </div>

        {/* Yoga (with progress) */}
        <div className="rounded-xl border border-white/10 bg-black/20 p-4 md:col-span-2">
          <div className="text-xs text-slate-400 mb-2">Yoga</div>
          <div className="text-lg text-slate-100">{yogaName}</div>
          <div className="mt-3">
            <Meter value={yogaProg} label="Progress" />
          </div>
        </div>

        {/* Quick chips */}
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <div className="text-xs text-slate-400 mb-2">Quick view</div>
          <div className="flex flex-wrap gap-2 text-[11px]">
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5">
              {weekday}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5">
              Tithi: {tithiName}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5">
              Yoga: {yogaName}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5">
              Karana: {karanaName}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5">
              Nakshatra: {nakName}{nakPada ? ` (Pada ${nakPada})` : ""}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
