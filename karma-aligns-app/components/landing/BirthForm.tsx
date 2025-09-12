'use client';

import React, { useState, useEffect } from 'react'; // Add useEffect
export type BirthFormValues = { name?: string; date: string; time: string; tz: string; lat: string; lon: string; };

export default function BirthForm({ onSubmit, initialValues }: { onSubmit: (v: BirthFormValues) => void; initialValues?: BirthFormValues; }) {
  const [v, setV] = useState<BirthFormValues>(initialValues || { name:'', date:'', time:'', tz:'+05:30', lat:'', lon:'' });
  const disabled = !v.date || !v.time || !v.tz || !v.lat || !v.lon;

  // Use useEffect to handle changes to initialValues prop
  useEffect(() => {
    if (initialValues) {
      setV(initialValues);
    } else {
      setV({ name:'', date:'', time:'', tz:'+05:30', lat:'', lon:'' });
    }
  }, [initialValues]);

  function set<K extends keyof BirthFormValues>(k: K, val: BirthFormValues[K]) {
    setV(prev => ({ ...prev, [k]: val }));
  }

  return (
    <form
      id="form"
      onSubmit={(e)=>{ e.preventDefault(); onSubmit(v);}}
      className="grid gap-4 p-5"
      aria-describedby="form-help"
    >
      <div className="grid gap-2">
        <label className="text-sm text-white/70" htmlFor="name">Full name (optional)</label>
        <input id="name" value={v.name||''} onChange={e=>set('name', e.target.value)}
               className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 placeholder-white/30"
               placeholder="Your name" />
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        <div className="grid gap-2">
          <label className="text-sm text-white/70" htmlFor="dob">Date of birth</label>
          <input id="dob" type="date" value={v.date} onChange={e=>set('date', e.target.value)}
                 className="rounded-xl border border-white/10 bg-white/5 px-3 py-2" />
        </div>
        <div className="grid gap-2">
          <label className="text-sm text-white/70" htmlFor="tob">Time of birth</label>
          <input id="tob" type="time" value={v.time} onChange={e=>set('time', e.target.value)}
                 className="rounded-xl border border-white/10 bg-white/5 px-3 py-2" />
        </div>
        <div className="grid gap-2">
          <label className="text-sm text-white/70" htmlFor="tz">Time zone</label>
          <input id="tz" value={v.tz} onChange={e=>set('tz', e.target.value)}
                 className="rounded-xl border border-white/10 bg-white/5 px-3 py-2" placeholder="+05:30" />
        </div>
        <div className="grid gap-2">
          <label className="text-sm text-white/70" htmlFor="lat">Latitude</label>
          <input id="lat" value={v.lat} onChange={e=>set('lat', e.target.value)}
                 className="rounded-xl border border-white/10 bg-white/5 px-3 py-2" placeholder="26.7606" />
        </div>
        <div className="grid gap-2">
          <label className="text-sm text-white/70" htmlFor="lon">Longitude</label>
          <input id="lon" value={v.lon} onChange={e=>set('lon', e.target.value)}
                 className="rounded-xl border border-white/10 bg-white/5 px-3 py-2" placeholder="83.3732" />
        </div>
      </div>

      <p id="form-help" className="text-xs text-white/50">Your data stays on-device until you generate a chart.</p>

      <div className="flex gap-3 pt-1">
        <button type="submit" disabled={disabled}
                className="rounded-2xl bg-gradient-to-r from-fuchsia-400 to-sky-400 px-4 py-2 text-sm font-semibold text-black/90 disabled:opacity-50">
          Generate chart
        </button>
        <button type="button" onClick={() => setV({ name:'', date:'', time:'', tz:'+05:30', lat:'', lon:'' })}
                className="rounded-2xl border border-white/10 px-4 py-2 text-sm font-semibold text-white/70 disabled:opacity-50">
          Reset
        </button>
      </div>
    </form>
  );
}