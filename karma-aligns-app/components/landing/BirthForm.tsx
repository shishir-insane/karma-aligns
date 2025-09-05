"use client";
  
  import React, { useEffect, useState } from "react";
  import { ArrowRight, Moon, Sun } from "lucide-react";
  import Field from "./Field";
  import { tzOptions } from "./constants";
  
  export default function BirthForm() {
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({ name: "", date: "", time: "", tz: "+05:30", lat: "", lon: "" });
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
  
    function onChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
      const { name, value } = e.target;
      setForm((s) => ({ ...s, [name]: value }));
    }
  
    async function onSubmit(e: React.FormEvent) {
      e.preventDefault();
      setSubmitting(true);
      // TODO: Hook to your API endpoint
      setTimeout(() => setSubmitting(false), 1200);
    }
  
    if (!mounted) {
      return <div className="mt-8 h-44 w-full max-w-xl rounded-3xl border border-white/10 bg-white/5" />;
    }
  
    return (
      <form onSubmit={onSubmit} className="mt-8 max-w-xl rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md md:p-6" data-lpignore="true" data-lastpass-ignore="true" data-1p-ignore="true" autoComplete="off">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Full Name" htmlFor="name">
            <input id="name" name="name" placeholder="Arjun Sharma" value={form.name} onChange={onChange} className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm placeholder-slate-400 outline-none ring-0 focus:border-sky-400/50" data-lpignore="true" data-lastpass-ignore="true" data-1p-ignore="true" />
          </Field>
          <Field label="Date of Birth" htmlFor="date">
            <input id="date" name="date" type="date" value={form.date} onChange={onChange} className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none focus:border-sky-400/50" data-lpignore="true" data-lastpass-ignore="true" data-1p-ignore="true" />
          </Field>
          <Field label="Time of Birth" htmlFor="time">
            <input id="time" name="time" type="time" step="60" value={form.time} onChange={onChange} className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none focus:border-sky-400/50" data-lpignore="true" data-lastpass-ignore="true" data-1p-ignore="true" />
          </Field>
          <Field label="Timezone (±HH:MM)" htmlFor="tz">
            <select id="tz" name="tz" value={form.tz} onChange={onChange} className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none focus:border-sky-400/50" data-lpignore="true" data-lastpass-ignore="true" data-1p-ignore="true">
              {tzOptions.map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </Field>
          <Field label="Latitude" htmlFor="lat" hint="e.g., 26.7606">
            <input id="lat" name="lat" inputMode="decimal" placeholder="26.7606" value={form.lat} onChange={onChange} className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none focus:border-sky-400/50" data-lpignore="true" data-lastpass-ignore="true" data-1p-ignore="true" />
          </Field>
          <Field label="Longitude" htmlFor="lon" hint="e.g., 83.3732">
            <input id="lon" name="lon" inputMode="decimal" placeholder="83.3732" value={form.lon} onChange={onChange} className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none focus:border-sky-400/50" data-lpignore="true" data-lastpass-ignore="true" data-1p-ignore="true" />
          </Field>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 rounded-2xl bg-[#e0577d] px-4 py-2 text-sm font-medium text-white shadow-lg shadow-[#e0577d22] transition hover:brightness-110 focus:outline-none disabled:opacity-60">
            {submitting ? (
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
            ) : (
              <ArrowRight className="h-4 w-4" />
            )}
            Let&apos;s Begin
          </button>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Sun className="h-4 w-4" /> <span>Accurate ephemerides</span>
            <span className="mx-2">•</span>
            <Moon className="h-4 w-4" /> <span>Lahiri ayanāṁśa</span>
          </div>
        </div>
      </form>
    );
  }