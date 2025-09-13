'use client';

import { Award, Star, Users } from 'lucide-react';
import React from 'react';
import { Shield, Sparkles } from 'lucide-react';

export default function TrustStrip() {
  const items = [
    { icon: <Users className="w-4 h-4" />, text: 'Join 10,000+ souls who\'ve transformed their lives' },
    { icon: <Star className="w-4 h-4 text-yellow-400" />, text: '4.9/5 rating ★★★★★' },
    { icon: <Award className="w-4 h-4" />, text: 'Accuracy guaranteed' },
  ];

  return (
    <div className="w-full bg-black/30 backdrop-blur-sm border-t border-b border-white/10 py-3">
      {/* Social Proof */}
      <div className="mx-auto flex max-w-3xl items-center justify-center gap-6 text-sm text-white/80">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-fuchsia-400" />
          <span>Join 47,000+ souls transformed</span>
        </div>
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          ))}
          <span className="ml-1">4.9/5 from 12,847 readings</span>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-green-400" />
          <span>Accuracy guaranteed</span>
        </div>
      </div>
    </div>
  );
}

