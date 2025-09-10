"use client";

import React, { useState } from "react";
import { saveCompute } from "@/lib/computeCache";
import { Sparkles } from "lucide-react";

export type BirthFormValues = {
  name?: string;
  date: string;
  time: string;
  tz: string;
  lat: string;
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

  function toParams(v: BirthFormValues) {
    const tzRaw = decodeURIComponent((v.tz || "").trim().replace(/\s+/g, ""));
    const tz = tzRaw ? (/^[+-]/.test(tzRaw) ? tzRaw : `+${tzRaw}`) : "";
    return { dob: v.date?.trim(), tob: v.time?.trim(), tz, lat: v.lat?.trim(), lon: v.lon?.trim() };
  }
  const valid = (p: ReturnType<typeof toParams>) => p.dob && p.tob && p.tz && p.lat && p.lon;

  async function computeAndCache(v: BirthFormValues) {
    const params = toParams(v);
    if (!valid(params)) return;
    try {
      const res = await fetch("http://localhost:5000/api/v1/compute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dob: params.dob, tob: params.tob, tz: params.tz,
          lat: parseFloat(params.lat!), lon: parseFloat(params.lon!),
        }),
      });
      if (res.ok) {
        const json = await res.json();
        saveCompute(params, json);
      }
    } catch {}
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

  const samples: { label: string; v: BirthFormValues }[] = [
    { label: "Sample 1 • Gorakhpur 1984", v: { name: "Sample 1", date: "1984-09-24", time: "17:30", tz: "+05:30", lat: "26.7606", lon: "83.3732" } },
    { label: "Sample 2 • Silchar 1986", v: { name: "Sample 2", date: "1986-03-17", time: "16:50", tz: "+05:30", lat: "24.8332", lon: "92.7789" } },
    { label: "Sample 3 • Bangalore 2015", v: { name: "Sample 3", date: "2015-08-14", time: "22:30", tz: "+05:30", lat: "12.9715", lon: "77.5945" } },
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

  return (
    <div className={className}>
      <div className="rounded-2xl bg-white/5/50 p-4 backdrop-blur-lg sm:p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
        {/* Heading + sample presets (top) */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="font-heading text-lg text-sky-200">Birth details</div>
            <p className="mt-1 text-sm text-slate-300/90">Enter your data or try a sample.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {samples.map((s) => (
              <button
                key={s.label}
                type="button"
                disabled={disabled}
                onClick={() => quickRun(s.v)}
                className="inline-flex items-center gap-1.5 rounded-full border border-sky-300/30 bg-sky-300/10 px-3 py-1.5 text-xs text-sky-100 hover:bg-sky-300/20 disabled:opacity-60"
                title="Prefill & compute, then open results"
              >
                <Sparkles className="h-3.5 w-3.5" />
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* EXTRA SPACE between samples and form */}
        <div className="h-2" />

        {/* Form */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-2 font-body">
          <div>
            <label className="mb-1 block text-xs text-slate-300">Full name (optional)</label>
            <input
              name="name"
              value={values.name || ""}
              onChange={(e) => setField("name", e.target.value)}
              placeholder="Your name"
              className="w-full rounded-md bg-white/10 px-3 py-2 outline-none placeholder:text-slate-400"
            />
          </div>

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

          <div>
            <label className="mb-1 block text-xs text-slate-300">Timezone (±HH:MM)</label>
            <input
              name="tz"
              placeholder="+05:30"
              required
              value={values.tz}
              onChange={(e) => setField("tz", e.target.value)}
              className="w-full rounded-md bg-white/10 px-3 py-2 outline-none"
            />
            <p className="mt-1 text-[11px] text-slate-400">Example: +05:30, -08:00</p>
          </div>

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

          {/* CTAs */}
          <div className="col-span-1 mt-2 flex flex-wrap items-center gap-3 sm:col-span-2">
            <button
              type="submit"
              disabled={disabled}
              className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-400 to-fuchsia-400 px-5 py-2.5 text-sm font-semibold text-slate-900 shadow-lg shadow-fuchsia-500/20 hover:brightness-110 disabled:opacity-60"
            >
              <span>{disabled ? "Computing…" : "Generate chart"}</span>
              <span className="transition-transform group-hover:translate-x-0.5">↗</span>
            </button>

            <button
              type="button"
              disabled={disabled}
              onClick={() => setValues({ name: "", date: "", time: "", tz: "+05:30", lat: "", lon: "" })}
              className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm text-slate-100 hover:bg-white/10 disabled:opacity-60"
            >
              Clear
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
