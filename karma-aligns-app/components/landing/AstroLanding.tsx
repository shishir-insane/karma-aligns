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
import ShootingStars from './ShootingStars';

export default function AstroLanding({ wheelSrc='/karma-wheel.png' }: { wheelSrc?: string }) {
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(values: BirthFormValues) {
    setSubmitting(true);
    try {
      // navigate to results with query params (keeps SSR-safe)
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
      {/* Background Layer: Stars, Moon, Ambient Bodies */}
      <div className="absolute inset-0 z-0">
        <Starfield />
        <AmbientBodies />
        <Moon />
        <ShootingStars maxActive={3} minDelayMs={1800} maxDelayMs={5200} trigger='auto' />
      </div>

      {/* Foreground Layer: Header and Main Content */}
      <div className="relative z-10">
        <SiteHeader />

        <main className="container relative z-10 mx-auto grid min-h-[calc(100dvh-10rem)] items-center px-4 py-10 md:py-20 md:grid-cols-2 md:gap-12">
          {/* Form and Text */}
          <MotionFade delay={0.2} className="w-full">
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
                <p className="max-w-prose font-body text-white/70">
                  Submit your birth details to begin.
                </p>
              </div>

              <Card className="p-1">
                <BirthForm onSubmit={handleSubmit} />
              </Card>
            </div>
          </MotionFade>

          {/* Wheel Image */}
          <MotionFade delay={0.1} className="w-full">
            <div className="relative mx-auto aspect-square bg-white/5 p-4 rounded-full">
              <Image
                src={wheelSrc}
                alt="Zodiac wheel"
                fill
                priority
                className="rounded-full opacity-100 spin-slow"
                sizes="(min-width: 768px) 480px, 70vw"
              />
              {/* subtle animated highlight dot */}
              <div className="absolute left-[68%] top-[44%] h-3 w-3 animate-pulse rounded-full bg-amber-300/90 shadow-[0_0_40px_8px_rgba(251,191,36,.25)]" />
            </div>
          </MotionFade>
        </main>
      </div>
    </div>
  );
}