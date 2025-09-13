'use client';

import React, { useState, useRef, useEffect } from 'react';
import SiteHeader from './SiteHeader';
import Starfield from './Starfield';
import AmbientBodies from './AmbientBodies';
import ShootingStars from './ShootingStars';
import ConstellationOverlay from './ConstellationOverlay';
import SiteFooter from './SiteFooter';
import { ChevronDown, ArrowUp } from 'lucide-react';
import { BirthFormValues } from './BirthForm';
import Hero from './Hero';
import TrustStrip from './TrustStrip';
import ChartForm from './ChartForm';
import DemoProfiles from './DemoProfiles';
import ValueGrid from './ValueGrid';
import PreviewSection from './PreviewSection';

export default function AstroLanding({ wheelSrc = '/karma-wheel.png' }: { wheelSrc?: string }) {
  const [submitting, setSubmitting] = useState(false);
  const [prefillValues, setPrefillValues] = useState<BirthFormValues | undefined>(undefined);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);
  const formRef = useRef<HTMLDivElement>(null);

  // Handle scroll to show/hide buttons
  useEffect(() => {
    const handleScroll = () => {
      const heroHeight = window.innerHeight * 0.8; // 80% of viewport height
      setShowBackToTop(window.scrollY > 400);
      setShowScrollIndicator(window.scrollY < heroHeight);
    };
    
    // Set initial state
    handleScroll();
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
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
        behavior: 'smooth'
      });
    }
  }

  function scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  return (
    <div className="relative overflow-hidden min-h-screen">
      {/* Background Layer: Stars, Moon, Ambient Bodies */}
      <div className="absolute inset-0 z-0">
        <Starfield />
        <AmbientBodies />
        <ConstellationOverlay />
        <ShootingStars maxActive={3} minDelayMs={1800} maxDelayMs={5200} trigger='auto' />
      </div>

      {/* Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 bg-fuchsia-500/20 backdrop-blur-md border border-fuchsia-400/30 text-fuchsia-300 p-4 rounded-full shadow-xl hover:bg-fuchsia-500/30 hover:scale-110 transition-all duration-300 group"
          aria-label="Back to top"
        >
          <ArrowUp className="w-5 h-5 group-hover:animate-pulse" />
        </button>
      )}

      {/* Fixed Scroll Indicator at bottom of viewport - only show when in hero section */}
      {showScrollIndicator && (
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