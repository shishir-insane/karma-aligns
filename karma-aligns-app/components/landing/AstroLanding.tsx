'use client';

import React, { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import SiteHeader from './SiteHeader';
import SiteFooter from './SiteFooter';
import { ChevronDown, ArrowUp } from 'lucide-react';
import { BirthFormValues } from './BirthForm';
import Hero from './Hero';
import TrustStrip from './TrustStrip';
import ChartForm from './ChartForm';
import DemoProfiles from './DemoProfiles';
import ValueGrid from './ValueGrid';
import PreviewSection from './PreviewSection';

const Starfield = dynamic(() => import('./Starfield'), { ssr: false });
const AmbientBodies = dynamic(() => import('./AmbientBodies'), { ssr: false });
const ConstellationOverlay = dynamic(() => import('./ConstellationOverlay'), { ssr: false });
const ShootingStars = dynamic(() => import('./ShootingStars'), { ssr: false });

export default function AstroLanding({ wheelSrc = '/karma-wheel.png' }: { wheelSrc?: string }) {
  const [submitting, setSubmitting] = useState(false);
  const [prefillValues, setPrefillValues] = useState<BirthFormValues | undefined>(undefined);
  const [scrollState, setScrollState] = useState({ showBackToTop: false, showScrollIndicator: true });
  const [reduceMotion, setReduceMotion] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduceMotion(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  // Handle scroll to show/hide buttons
  useEffect(() => {
    let heroHeight = window.innerHeight * 0.8;
    let ticking = false;

    const update = () => {
      const y = window.scrollY;
      setScrollState({
        showBackToTop: y > 400,
        showScrollIndicator: y < heroHeight,
      });
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    };

    const onResize = () => {
      heroHeight = window.innerHeight * 0.8;
      onScroll();
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, []);

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

  function handlePrefill(values: BirthFormValues) {
    setPrefillValues(values);
    scrollToForm();
  }

  function handleNewForm() {
    setPrefillValues(undefined);
    scrollToForm();
  }

  function scrollToForm() {
    if (formRef.current) {
      const elementTop = formRef.current.offsetTop;
      const offset = 80;

      window.scrollTo({
        top: elementTop - offset,
        behavior: reduceMotion ? 'auto' : 'smooth'
      });
    }
  }

  function scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: reduceMotion ? 'auto' : 'smooth'
    });
  }

  return (
    <div className="relative overflow-hidden min-h-screen">
      {/* Background Layer: Stars, Moon, Ambient Bodies */}
      <div className="absolute inset-0 z-0">
        <Starfield />
        <AmbientBodies />
        <ConstellationOverlay />
        {!reduceMotion && (
          <ShootingStars maxActive={3} minDelayMs={1800} maxDelayMs={5200} trigger="auto" />
        )}
      </div>

      {/* Back to Top Button */}
      {scrollState.showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 bg-fuchsia-500/20 backdrop-blur-md border border-fuchsia-400/30 text-fuchsia-300 p-4 rounded-full shadow-xl hover:bg-fuchsia-500/30 hover:scale-110 transition-all duration-300 group"
          aria-label="Back to top"
        >
          <ArrowUp className="w-5 h-5 group-hover:animate-pulse" />
        </button>
      )}

      {/* Fixed Scroll Indicator at bottom of viewport - only show when in hero section */}
      {scrollState.showScrollIndicator && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-40 animate-bounce">
          <button
            onClick={scrollToForm}
            className="flex flex-col items-center text-white/60 hover:text-fuchsia-300 transition-all duration-300 group bg-slate-900/40 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/20 hover:border-fuchsia-400/40 shadow-xl hover:shadow-2xl hover:scale-105"
            aria-label="Scroll to form"
          >
            <span className="text-sm font-medium mb-1 group-hover:scale-105 transition-transform">
              Start your journey
            </span>
            <ChevronDown className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </button>
        </div>
      )}

      {/* Foreground Layer */}
      <div className="relative z-10">
        <SiteHeader />
        <div className="-mt-40">
          <Hero wheelSrc={wheelSrc} onCTAClick={scrollToForm} />
        </div>
        <TrustStrip />
        <section id="birth-form" ref={formRef} className="container mx-auto py-16 px-4">
          <ChartForm onSubmit={handleSubmit} initialValues={prefillValues} isSubmitting={submitting} />
          <DemoProfiles onSelect={handlePrefill} onNewForm={handleNewForm} />
          <ValueGrid />
          <PreviewSection wheelSrc={wheelSrc} />
        </section>
      </div>

      <SiteFooter />
    </div>
  );
}