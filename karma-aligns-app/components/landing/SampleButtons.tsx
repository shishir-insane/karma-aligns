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
      data: {
        name: 'Nikola Tesla',
        date: '1856-07-10',
        time: '00:00',
        tz: '+01:00',
        lat: '44.8125',
        lon: '20.4612'
      }
    },
    {
      name: 'Marie Curie',
      icon: <Brain className="w-4 h-4" />,
      data: {
        name: 'Marie Curie',
        date: '1867-11-07',
        time: '12:00',
        tz: '+01:00',
        lat: '52.2297',
        lon: '21.0122'
      }
    },
    {
      name: 'Albert Einstein',
      icon: <User className="w-4 h-4" />,
      data: {
        name: 'Albert Einstein',
        date: '1879-03-14',
        time: '11:30',
        tz: '+01:00',
        lat: '48.4069',
        lon: '9.9945'
      }
    }
  ];

  return (
    <div className="flex flex-col sm:flex-row gap-3 w-full">
      {samples.map((sample, index) => (
        <button
          key={sample.name}
          onClick={() => onSelect(sample.data)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-700/50 hover:bg-slate-600/60 border-2 border-slate-600/40 hover:border-slate-500/60 text-sm font-medium text-white/80 hover:text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        >
          {sample.icon}
          <span>{sample.name}</span>
        </button>
      ))}
      
      <button
        onClick={onNewForm}
        className="flex-shrink-0 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-700/50 hover:bg-slate-600/60 border-2 border-slate-600/40 hover:border-slate-500/60 text-sm font-medium text-white/80 hover:text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
      >
        <Plus className="w-4 h-4" />
        <span>New Form</span>
      </button>
    </div>
  );
}