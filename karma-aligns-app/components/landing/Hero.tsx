'use client';

import Image from 'next/image';
import React from 'react';
import { scrollToId } from "../utils/scroll";

interface HeroProps {
  wheelSrc?: string;
  onCTAClick?: () => void;
}

export default function Hero({ wheelSrc = '/karma-wheel.png', onCTAClick }: HeroProps) {
  return (
    <section className="relative flex min-h-screen items-center justify-center p-6">
      <div className="grid w-full max-w-7xl gap-10 md:grid-cols-2">
        {/* Left side: headline, subheading, CTA */}
        <div className="flex flex-col justify-center space-y-6 text-center md:text-left">
          <h1 className="font-heading text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
            Balance your{" "}
            <span className="headline-glow text-fuchsia-400 drop-shadow-[0_0_20px_rgba(217,70,239,0.5)]">
              Karma
              <span aria-hidden className="headline-sparkle" />
            </span>
            <br />
            Align your{" "}
            <span className="headline-glow text-fuchsia-400 drop-shadow-[0_0_20px_rgba(217,70,239,0.5)]">
              Life
              <span aria-hidden className="headline-sparkle" />
            </span>
          </h1>

          <p className="max-w-xl mx-auto md:mx-0 text-white/80 text-lg">
            Discover your unique cosmic blueprint with personalized insights.
          </p>

          <div>
            <button
              onClick={onCTAClick}
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95"
            >
              ✨ Generate My Chart
            </button>
          </div>
        </div>

        {/* Right side: zodiac wheel */}
        <div className="flex items-center justify-center">
          <div className="relative w-72 h-72 md:w-96 md:h-96">
            <Image
              src={wheelSrc}
              alt="Zodiac wheel"
              fill
              priority
              className="rounded-full opacity-95 spin-slow select-none"
            />
            <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_50%,#8ecbff22,transparent_60%)]" />
          </div>
        </div>
      </div>
    </section>
  );
}
