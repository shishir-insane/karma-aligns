'use client';

import React, { useState, useRef } from 'react';
import MotionFade from '@/components/ui/MotionFade';
import Card from '@/components/ui/Card';
import SiteHeader from './SiteHeader';
import Starfield from './Starfield';
import AmbientBodies from './AmbientBodies';
import BirthForm, { BirthFormValues } from './BirthForm';
import Image from 'next/image';
import Moon from './Moon';
import ShootingStars from './ShootingStars';
import SampleButtons from './SampleButtons'; // Import the new component

export default function AstroLanding({ wheelSrc = '/karma-wheel.png' }: { wheelSrc?: string }) {
  const [submitting, setSubmitting] = useState(false);
  const [prefillValues, setPrefillValues] = useState<BirthFormValues | undefined>(undefined);
  const [formKey, setFormKey] = useState(0); // Add a key to force form re-mount
  const formRef = useRef<HTMLElement>(null);

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

  function handlePrefill(values: BirthFormValues) {
    setPrefillValues(values);
    setFormKey(prevKey => prevKey + 1); // Force re-mount to load new data
    if (formRef.current) {
        formRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }

  function handleNewForm() {
    setPrefillValues(undefined);
    setFormKey(prevKey => prevKey + 1); // Force re-mount to clear form
    if (formRef.current) {
        formRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }

  const headingText = "Balance your karma\nAlign your life";

  return (
    <div className="relative overflow-hidden">
      {/* Background Layer: Stars, Moon, Ambient Bodies */}
      <div className="absolute inset-0 z-0">
        <Starfield />
        <AmbientBodies />
        <Moon />
        <ShootingStars maxActive={3} minDelayMs={1800} maxDelayMs={5200} trigger='auto' />
      </div>

      {/* Foreground Layer */}
      <div className="relative z-10">
        <SiteHeader />

        {/* Hero Section */}
        <section id="hero" className="relative flex min-h-screen flex-col items-center p-4 py-20 text-center z-10 gap-6">
          <div className="w-full max-w-sm">
            <div className="relative aspect-square">
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
          </div>

          {/* Heading Text - now below the wheel and with a negative top margin */}
          <div className="w-full relative z-20 -mt-12">
            <h1
              className="font-heading text-6xl md:text-8xl font-extrabold leading-none tracking-tighter text-white hero-heading heading-shadow-container py-4"
              data-text={headingText}
            >
              Balance your <span className="text-fuchsia-400 underline">karma</span>
              <br />
              <span className="text-fuchsia-400 underline">Align</span> your life
            </h1>
          </div>

          {/* New CTA Button */}
          <SampleButtons onSelect={handlePrefill} onNewForm={handleNewForm} />
        </section>

        {/* Birth Form Section */}
        <section id="birth-form" ref={formRef} className="container mx-auto py-20 px-4">
          <MotionFade delay={0.1}>
            <div className="mx-auto max-w-xl">
              <div className="mb-8 space-y-2 text-center">
                <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
                  <span className="h-2 w-2 rounded-full bg-fuchsia-300/80" /> Enter your birth details
                </p>
                <h2 className="font-heading text-4xl leading-tight tracking-tight text-white md:text-5xl">
                  Balance your karma
                  <br />
                  <span className="text-white/80">Align your life</span>
                </h2>
                <p className="max-w-prose font-body text-white/70">
                  Submit your birth details to begin.
                </p>
              </div>
              <Card className="p-1">
                {/* Add initialValues prop and the key */}
                <BirthForm
                  key={formKey}
                  onSubmit={handleSubmit}
                  initialValues={prefillValues}
                />
              </Card>
            </div>
          </MotionFade>
        </section>
      </div>
    </div>
  );
}