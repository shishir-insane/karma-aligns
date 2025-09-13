'use client';

import React from 'react';
import { ScrollText, Globe, Sparkles, Telescope } from 'lucide-react';

export default function ValueGrid() {
  const items = [
    { icon: <ScrollText className="w-6 h-6" />, label: 'Birth Chart Visualization' },
    { icon: <Globe className="w-6 h-6" />, label: 'Planetary Positions' },
    { icon: <Sparkles className="w-6 h-6" />, label: 'Karmic Insights' },
    { icon: <Telescope className="w-6 h-6" />, label: 'Personalized Reading' },
  ];
  return (
    <div className="mt-12 text-center">
      <div className="flex items-center justify-center gap-2 mb-6">
        <p className="text-white/80 text-lg font-semibold">What you&apos;ll receive:</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
        {items.map((item, idx) => (
          <div key={idx} className="bg-gradient-to-br from-fuchsia-500/20 to-purple-600/20 px-4 py-3 rounded-xl border border-fuchsia-500/30 backdrop-blur-sm flex flex-col items-center gap-2">
            {item.icon}
            <span className="text-sm font-medium text-white/90">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

