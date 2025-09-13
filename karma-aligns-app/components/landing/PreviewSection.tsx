'use client';

import Image from 'next/image';
import React from 'react';

export default function PreviewSection({ wheelSrc = '/karma-wheel.png' }: { wheelSrc?: string }) {
  return (
    <section className="mt-16">
      <div className="mx-auto grid max-w-5xl items-center gap-12 px-4 md:grid-cols-2">
        <div className="flex items-center justify-center">
          <div className="relative w-64 h-64 md:w-80 md:h-80">
            <Image src={wheelSrc} alt="Sample chart" fill className="rounded-full opacity-90" />
          </div>
        </div>
        <div className="space-y-4 text-white/80">
          <h3 className="text-2xl font-heading text-white">Why this matters</h3>
          <ul className="list-disc pl-5 space-y-2 text-sm">
            <li>Visualize your birth chart instantly.</li>
            <li>Understand planetary influences.</li>
            <li>Gain actionable karmic insights.</li>
          </ul>
          <button className="mt-4 px-6 py-3 rounded-2xl bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white font-semibold hover:scale-105 active:scale-95 transition-all duration-300">
            See My Cosmic Blueprint
          </button>
        </div>
      </div>
    </section>
  );
}

