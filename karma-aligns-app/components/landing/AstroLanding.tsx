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
import SampleButtons from './SampleButtons';
import SiteFooter from './SiteFooter';

export default function AstroLanding({ wheelSrc = '/karma-wheel.png' }: { wheelSrc?: string }) {
  const [submitting, setSubmitting] = useState(false);
  const [prefillValues, setPrefillValues] = useState<BirthFormValues | undefined>(undefined);
  const formRef = useRef<HTMLDivElement>(null); // Re-introduce the form reference for scrolling
  const headingText = "Balance your Karma, Align your Life."

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

  // UPDATED: This function now pre-fills the data AND scrolls to the form
  function handlePrefill(values: BirthFormValues) {
    setPrefillValues(values);
    scrollToForm();
  }

  // This function clears the data and scrolls to the form
  function handleNewForm() {
    setPrefillValues(undefined);
    scrollToForm();
  }

  // Helper function for controlled scrolling
  function scrollToForm() {
    if (formRef.current) {
      const elementTop = formRef.current.offsetTop;
      const offset = 80; // Add some padding from the top
      
      window.scrollTo({
        top: elementTop - offset,
        behavior: 'smooth'
      });
    }
  }

  return (
    <div className="relative overflow-hidden">
      {/* Background Layer: Stars, Moon, Ambient Bodies */}
      <div className="absolute inset-0 z-0">
        <Starfield />
        <AmbientBodies />
        <ShootingStars maxActive={3} minDelayMs={1800} maxDelayMs={5200} trigger='auto' />
      </div>

      {/* Foreground Layer */}
      <div className="relative z-10">
        <SiteHeader />

        {/* Hero Section */}
        <section id="hero" className="relative flex min-h-screen flex-col items-center p-4 py-2 text-center z-10 gap-6">

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
          <div className="w-full">
            <h1
              className="font-heading text-6xl md:text-8xl font-regular leading-none tracking-tighter text-white hero-heading heading-shadow-container py-2"
              data-text={headingText}
            >
              Balance your <span className="text-fuchsia-400">Karma</span>
              <br />
              <span className="text-fuchsia-400">Align</span> your life
            </h1>
          </div>

          {/* Sample Data Buttons */}
          <SampleButtons onSelect={handlePrefill} onNewForm={handleNewForm} />
        </section>

        {/* Birth Form Section */}
        <section id="birth-form" ref={formRef} className="container mx-auto py-20 px-4">
          <MotionFade delay={0.1}>
            <div className="mx-auto max-w-xl">
              <div className="mb-8 space-y-2 text-center">
                <p className="max-w-prose font-body text-white/70">
                  Submit your birth details to begin.
                </p>
              </div>
              <Card className="p-1">
                <BirthForm onSubmit={handleSubmit} initialValues={prefillValues} />
              </Card>
            </div>
          </MotionFade>
        </section>
      </div>

      <SiteFooter />
    </div>
  );
}