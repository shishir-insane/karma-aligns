'use client';

import { Award, Star, Users } from 'lucide-react';
import React from 'react';

export default function TrustStrip() {
  const items = [
    { icon: <Users className="w-4 h-4" />, text: '1000+ charts generated' },
    { icon: <Star className="w-4 h-4 text-yellow-400" />, text: '4.9/5 rating' },
    { icon: <Award className="w-4 h-4" />, text: 'AI-powered insights' },
  ];

  return (
    <div className="w-full bg-black/30 backdrop-blur-sm border-t border-b border-white/10 py-3">
      <div className="mx-auto flex max-w-3xl items-center justify-center gap-6 text-sm text-white/80">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-1">
            {item.icon}
            <span>{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

