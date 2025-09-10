'use client';

import React, { useState } from 'react';
import MotionFade from '@/components/ui/MotionFade';
import Card from '@/components/ui/Card';
import SiteHeader from './SiteHeader';
import Starfield from './Starfield';
import AmbientBodies from './AmbientBodies';
import BirthForm, { BirthFormValues } from './BirthForm';
import Image from 'next/image';
import Moon from './Moon';

// Removed unnecessary imports
// import PlanetOverlay from './PlanetOverlay';
// import ConstellationOverlay from './ConstellationOverlay';

export default function AstroLanding({ wheelSrc='/karma-wheel.png' }: { wheelSrc?: string }) {
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(values: BirthFormValues) {
    setSubmitting(true);
    try {
      const params = new URLSearchParams({
        dob: values.date, tob: values.time, tz: values.tz, lat: values.lat, lon: values.lon
      }).toString();
      window.location.href = `/results?${params}`;
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-dvh overflow-hidden">
      <Starfield />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(600px_300px_at_30%_20%,rgba(99,102,241,0.12),transparent),radial-gradient(400px_200px_at=70%_40%,rgba(236,72,153,0.10),transparent)]" />

      <SiteHeader />

      <AmbientBodies />
      <Moon />
      {/* These components are no longer needed as their logic is in Starfield.tsx */}
      {/* <PlanetOverlay /> */}
      {/* <ConstellationOverlay /> */}

      <main className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 py-16 md:grid-cols-2">
        <MotionFade>
          <div className="space-y-6">
            <div className="space-y-2">
              <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
                <span className="h-2 w-2 rounded-full bg-fuchsia-300/80" /> Enter your birth details
              </p>
              <h1 className="font-heading text-5xl leading-tight tracking-tight text-white md:text-6xl">
                Balance your karma
                <br />
                <span className="text-white/80">Align your life</span>
              </h1>
              <p className="max-w-prose text-white/70">
                Submit your birth details to begin.
              </p>
            </div>

            <Card className="p-1">
              <BirthForm onSubmit={handleSubmit} />
            </Card>
          </div>
        </MotionFade>

        <MotionFade delay={0.1}>
          <div className="relative mx-auto aspect-square w-4/5 max-w-md">
            <Image
              src={wheelSrc}
              alt="Zodiac wheel"
              fill
              priority
              className="rounded-full opacity-90 spin-slow"
              sizes="(min-width: 768px) 480px, 70vw"
            />
            <div className="absolute left-[68%] top-[44%] h-3 w-3 animate-pulse rounded-full bg-amber-300/90 shadow-[0_0_40px_8px_rgba(251,191,36,.25)]" />
          </div>
        </MotionFade>
      </main>
    </div>
  );
}