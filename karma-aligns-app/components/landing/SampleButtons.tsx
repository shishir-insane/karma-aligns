'use client';

import React from 'react';
import { BirthFormValues } from './BirthForm';
import { User, Zap, Brain, Plus } from 'lucide-react';

interface SampleButtonsProps {
  onSelect: (values: BirthFormValues) => void;
  onNewForm: () => void;
}

export default function SampleButtons({ onSelect, onNewForm }: SampleButtonsProps) {
  const samples = [
    {
      name: 'Nikola Tesla',
      icon: <Zap className="w-4 h-4" />,
      data: { name: 'Nikola Tesla', date: '1856-07-10', time: '00:00', tz: '+01:00', lat: '44.8125', lon: '20.4612' }
    },
    {
      name: 'Marie Curie',
      icon: <Brain className="w-4 h-4" />,
      data: { name: 'Marie Curie', date: '1867-11-07', time: '12:00', tz: '+01:00', lat: '52.2297', lon: '21.0122' }
    },
    {
      name: 'Albert Einstein',
      icon: <User className="w-4 h-4" />,
      data: { name: 'Albert Einstein', date: '1879-03-14', time: '11:30', tz: '+01:00', lat: '48.4069', lon: '9.9945' }
    }
  ];

  return (
    <div className="w-full">
      {/* horizontal scroll on small screens; normal flow on ≥sm */}
      <div className="sm:hidden -mx-2 overflow-x-auto no-scrollbar">
        <div className="flex gap-3 min-w-max px-2">
          {samples.map(s => (
            <button
              key={s.name}
              onClick={() => onSelect(s.data)}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl
                         bg-slate-700/50 hover:bg-slate-600/60 border border-white/10 text-sm font-medium text-white/85
                         transition-all duration-200 hover:scale-[1.02] active:scale-95"
              aria-label={`Use sample ${s.name}`}
            >
              {s.icon}
              <span>{s.name}</span>
            </button>
          ))}
          <button
            onClick={onNewForm}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl
                       bg-slate-700/50 hover:bg-slate-600/60 border border-white/10 text-sm font-medium text-white/85
                       transition-all duration-200 hover:scale-[1.02] active:scale-95"
            aria-label="Start a new blank form"
          >
            <Plus className="w-4 h-4" />
            <span>New Form</span>
          </button>
        </div>
      </div>

      {/* stacked on small+ screens as before */}
      <div className="hidden sm:flex flex-col sm:flex-row gap-3 w-full">
        {samples.map(s => (
          <button
            key={s.name}
            onClick={() => onSelect(s.data)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl
                       bg-slate-700/50 hover:bg-slate-600/60 border border-white/10 text-sm font-medium text-white/85
                       transition-all duration-200 hover:scale-[1.02] active:scale-95"
          >
            {s.icon}
            <span>{s.name}</span>
          </button>
        ))}
        <button
          onClick={onNewForm}
          className="flex-shrink-0 flex items-center justify-center gap-2 px-4 py-3 rounded-xl
                     bg-slate-700/50 hover:bg-slate-600/60 border border-white/10 text-sm font-medium text-white/85
                     transition-all duration-200 hover:scale-[1.02] active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New Form</span>
        </button>
      </div>
    </div>
  );
}
