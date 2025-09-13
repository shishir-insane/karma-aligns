'use client';

import { BirthFormValues } from './BirthForm';
import { Zap, Brain, User, Plus } from 'lucide-react';

interface DemoProfilesProps {
  onSelect: (values: BirthFormValues) => void;
  onNewForm: () => void;
}

export default function DemoProfiles({ onSelect, onNewForm }: DemoProfilesProps) {
  const samples = [
    {
      name: 'Nikola Tesla',
      icon: <Zap className="w-4 h-4" />,
      data: { name: 'Nikola Tesla', date: '1856-07-10', time: '00:00', tz: '+01:00', lat: '44.8125', lon: '20.4612' }
    },
    {
      name: 'Marie Curie',
      icon: <Brain className="w-4 h-4" />,
      data: { name:'Marie Curie', dob:'1867-11-07', tob:'12:00', tz:'+01:00', lat:52.2297, lon:21.0122 }
    },
    {
      name: 'Albert Einstein',
      icon: <User className="w-4 h-4" />,
      data: { name: 'Albert Einstein', date: '1879-03-14', time: '11:30', tz: '+01:00', lat: '48.4069', lon: '9.9945' }
    }
  ];

  return (
    <section className="mx-auto max-w-5xl mt-10">
      {/* Purple card wrapper to match your page */}
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-fuchsia-900/25 to-indigo-900/20 backdrop-blur-sm shadow-2xl shadow-fuchsia-500/10 px-5 py-6">
        <h3 className="text-center font-semibold text-white/90">
          Don’t have your birth details handy?
          <span className="block text-sm text-white/70 mt-1">
            Try with these famous personalities to explore the platform:
          </span>
        </h3>

        {/* Mobile: horizontal chips */}
        <div className="sm:hidden mt-5 -mx-2 overflow-x-auto no-scrollbar">
          <div className="flex gap-3 min-w-max px-2">
            {samples.map(s => (
              <button
                key={s.name}
                onClick={() => onSelect(s.data)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white/90
                           hover:bg-white/8 transition-transform duration-200 hover:scale-[1.02] active:scale-95"
                aria-label={`Use sample ${s.name}`}
              >
                {s.icon}
                <span>{s.name}</span>
              </button>
            ))}
            <button
              onClick={onNewForm}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white/90
                         hover:bg-white/8 transition-transform duration-200 hover:scale-[1.02] active:scale-95"
              aria-label="Start a new blank form"
            >
              <Plus className="w-4 h-4" />
              <span>New Form</span>
            </button>
          </div>
        </div>

        {/* ≥ sm: full-width buttons in a row */}
        <div className="hidden sm:grid grid-cols-1 md:grid-cols-4 gap-3 mt-5">
          {samples.map(s => (
            <button
              key={s.name}
              onClick={() => onSelect(s.data)}
              className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white/90
                         hover:bg-white/8 transition-transform duration-200 hover:scale-[1.01] active:scale-95"
            >
              <span className="inline-flex items-center gap-2">{s.icon}<span>{s.name}</span></span>
            </button>
          ))}
          <button
            onClick={onNewForm}
            className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white/90
                       hover:bg-white/8 transition-transform duration-200 hover:scale-[1.01] active:scale-95"
          >
            <span className="inline-flex items-center gap-2"><Plus className="w-4 h-4" /><span>New Form</span></span>
          </button>
        </div>
      </div>
    </section>
  );
}