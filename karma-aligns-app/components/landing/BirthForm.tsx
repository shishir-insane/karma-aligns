"use client";

import React, { useState } from "react";
import { saveCompute } from "@/lib/computeCache";
import { Merriweather, Merriweather_Sans } from "next/font/google";
const merriweather = Merriweather({ subsets: ["latin"], weight: ["700"], display: "swap" });
const merriweatherSans = Merriweather_Sans({ subsets: ["latin"], weight: ["400", "700"], display: "swap" });

export type BirthFormValues = {
  name?: string;
  date: string;   // YYYY-MM-DD
  time: string;   // HH:mm
  tz: string;     // e.g. +05:30
  lat: string;    // string for inputs, parsed later
  lon: string;
};

export default function BirthForm({
  onSubmit,
  submitting = false,
  className = "",
}: {
  onSubmit?: (values: BirthFormValues) => void | Promise<void>;
  submitting?: boolean;
  className?: string;
}) {
  const [values, setValues] = useState<BirthFormValues>({
    name: "",
    date: "",
    time: "",
    tz: "+05:30",
    lat: "",
    lon: "",
  });
  const [busy, setBusy] = useState(false);
  const disabled = submitting || busy;

  function setField<K extends keyof BirthFormValues>(k: K, v: BirthFormValues[K]) {
    setValues((s) => ({ ...s, [k]: v }));
  }

  // Build params for /compute + cache
  function toParams(v: BirthFormValues) {
    const tzRaw = decodeURIComponent((v.tz || "").trim().replace(/\s+/g, ""));
    const tz = tzRaw ? (/^[+-]/.test(tzRaw) ? tzRaw : `+${tzRaw}`) : "";
    return { dob: v.date?.trim(), tob: v.time?.trim(), tz, lat: v.lat?.trim(), lon: v.lon?.trim() };
  }
  function valid(v: ReturnType<typeof toParams>) {
    return v.dob && v.tob && v.tz && v.lat && v.lon;
  }

  async function computeAndCache(v: BirthFormValues) {
    const params = toParams(v);
    if (!valid(params)) return;
    try {
      const res = await fetch("http://localhost:5000/api/v1/compute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dob: params.dob,
          tob: params.tob,
          tz: params.tz,
          lat: parseFloat(params.lat!),
          lon: parseFloat(params.lon!),
        }),
      });
      if (res.ok) {
        const json = await res.json();
        saveCompute(params, json); // so /results hydrates instantly
      }
    } catch {
      // ignore; /results can fall back to network
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (disabled) return;
    const params = toParams(values);
    if (!valid(params)) {
      alert("Please fill Date, Time, Timezone, Latitude and Longitude.");
      return;
    }
    setBusy(true);
    await computeAndCache(values);
    try {
      await onSubmit?.(values);
    } finally {
      setBusy(false);
    }
  }

  // ---------- Samples ----------
  const samples: { label: string; v: BirthFormValues }[] = [
    {
      label: "Sample • India (1984)",
      v: { name: "Sample India", date: "1984-09-24", time: "17:30", tz: "+05:30", lat: "26.7606", lon: "83.3732" },
    },
    {
      label: "Sample • NYC Winter",
      v: { name: "Sample NYC", date: "1990-01-15", time: "08:00", tz: "-05:00", lat: "40.7128", lon: "-74.0060" },
    },
    {
      label: "Sample • Sydney Spring",
      v: { name: "Sample Sydney", date: "2000-10-10", time: "14:15", tz: "+10:00", lat: "-33.8688", lon: "151.2093" },
    },
  ];

  async function quickRun(v: BirthFormValues) {
    if (disabled) return;
    setValues(v);
    setBusy(true);
    await computeAndCache(v);
    try {
      await onSubmit?.(v);
    } finally {
      setBusy(false);
    }
  }

  // ---------- UI ----------
  return (
    <div className={className}>
      <div className="rounded-2xl border border-white/10 bg-white/5/50 backdrop-blur-lg p-4 sm:p-6">
        <div className="mb-4">
          <div className={`${merriweather.className} text-lg text-sky-200`}>Birth details</div>
          <p className={`${merriweatherSans.className} mt-1 text-sm text-slate-300/90`}>
            Enter your data or pick a sample to try the experience instantly.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* Name (optional) */}
          <div className="col-span-1 sm:col-span-2">
            <label className="mb-1 block text-xs text-slate-300">Full name (optional)</label>
            <input
              name="name"
              value={values.name || ""}
              onChange={(e) => setField("name", e.target.value)}
              placeholder="Your name"
              className="w-full rounded-md bg-white/10 px-3 py-2 outline-none placeholder:text-slate-400"
            />
          </div>

          {/* Date */}
          <div>
            <label className="mb-1 block text-xs text-slate-300">Date of birth</label>
            <input
              name="date"
              type="date"
              required
              value={values.date}
              onChange={(e) => setField("date", e.target.value)}
              className="w-full rounded-md bg-white/10 px-3 py-2 outline-none"
            />
          </div>

          {/* Time */}
          <div>
            <label className="mb-1 block text-xs text-slate-300">Time of birth</label>
            <input
              name="time"
              type="time"
              required
              value={values.time}
              onChange={(e) => setField("time", e.target.value)}
              className="w-full rounded-md bg-white/10 px-3 py-2 outline-none"
            />
          </div>

          {/* Timezone */}
          <div>
            <label className="mb-1 block text-xs text-slate-300">Timezone (±HH:MM)</label>
            <input
              name="tz"
              inputMode="text"
              placeholder="+05:30"
              required
              value={values.tz}
              onChange={(e) => setField("tz", e.target.value)}
              className="w-full rounded-md bg-white/10 px-3 py-2 outline-none"
            />
            <p className="mt-1 text-[11px] text-slate-400">Example: +05:30, -08:00</p>
          </div>

          {/* Latitude */}
          <div>
            <label className="mb-1 block text-xs text-slate-300">Latitude</label>
            <input
              name="lat"
              inputMode="decimal"
              placeholder="26.7606"
              required
              value={values.lat}
              onChange={(e) => setField("lat", e.target.value)}
              className="w-full rounded-md bg-white/10 px-3 py-2 outline-none"
            />
          </div>

          {/* Longitude */}
          <div>
            <label className="mb-1 block text-xs text-slate-300">Longitude</label>
            <input
              name="lon"
              inputMode="decimal"
              placeholder="83.3732"
              required
              value={values.lon}
              onChange={(e) => setField("lon", e.target.value)}
              className="w-full rounded-md bg-white/10 px-3 py-2 outline-none"
            />
          </div>

          {/* Submit */}
          <div className="col-span-1 sm:col-span-2 mt-2 flex items-center gap-3">
            <button
              type="submit"
              disabled={disabled}
              className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm hover:bg-white/20 disabled:opacity-60"
            >
              {disabled ? "Computing…" : "Generate chart"}
            </button>

            {/* Samples */}
            <div className="ml-2 flex flex-wrap items-center gap-2">
              {samples.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  disabled={disabled}
                  onClick={() => quickRun(s.v)}
                  className="rounded-full border border-sky-300/20 bg-sky-300/10 px-3 py-1 text-xs text-sky-100 hover:bg-sky-300/20 disabled:opacity-60"
                  title="Prefill & compute, then open results"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
