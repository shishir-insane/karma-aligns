'use client';

import React, { useState, useRef, useEffect } from 'react';
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
import { ChevronDown, ArrowUp, Shield, Sparkles, Star, TrendingUp, Users, Award } from 'lucide-react';

export default function AstroLanding({ wheelSrc = '/karma-wheel.png' }: { wheelSrc?: string }) {
  const [submitting, setSubmitting] = useState(false);
  const [prefillValues, setPrefillValues] = useState<BirthFormValues | undefined>(undefined);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);
  const formRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const headingText = "Balance your Karma, Align your Life."

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

        {/* Hero Section */}
        <section id="hero" ref={heroRef} className="relative flex min-h-screen flex-col items-center justify-center p-4 py-8 text-center gap-8">

          <div className="w-full max-w-sm lg:max-w-md">
            <div className="relative aspect-square group">
              <Image
                src={wheelSrc}
                alt="Zodiac wheel"
                fill
                priority
                className="rounded-full opacity-100 spin-slow group-hover:scale-105 transition-transform duration-700"
                sizes="(min-width: 1024px) 500px, (min-width: 768px) 400px, 70vw"
              />
              {/* Enhanced animated highlight dot */}
              <div className="absolute left-[68%] top-[44%] h-4 w-4 animate-pulse rounded-full bg-amber-300/90 shadow-[0_0_50px_12px_rgba(251,191,36,.3)]" />
            </div>
          </div>

          <div className="w-full space-y-6">
            <h1 className="font-heading text-5xl md:text-7xl lg:text-8xl font-bold leading-none tracking-tighter text-white hero-heading heading-shadow-container py-4">
              Balance your <span className="text-fuchsia-400 drop-shadow-[0_0_20px_rgba(217,70,239,0.5)]">Karma</span>
              <br />
              <span className="text-fuchsia-400 drop-shadow-[0_0_20px_rgba(217,70,239,0.5)]">Align</span> your life
            </h1>
            
            {/* Enhanced subtitle */}
            <div className="max-w-3xl mx-auto space-y-4">
              <p className="text-white/80 text-lg md:text-xl lg:text-2xl font-body leading-relaxed">
                Discover your cosmic blueprint through personalized astrological insights. 
                Get your detailed birth chart, planetary positions, and karmic guidance.
              </p>
              
              {/* Social proof */}
              <div className="flex items-center justify-center gap-6 text-sm text-white/60 pt-4">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>1000+ charts generated</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <span>4.9/5 rating</span>
                </div>
                <div className="flex items-center gap-1">
                  <Award className="w-4 h-4" />
                  <span>AI-powered insights</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Birth Form Section */}
        <section id="birth-form" ref={formRef} className="container mx-auto py-16 px-4">
          <MotionFade delay={0.1}>
            <div className="mx-auto max-w-2xl">
              <div className="mb-10 space-y-6 text-center">
                {/* Enhanced heading with better visibility */}
                <div className="flex items-center justify-center gap-3 mb-6">
                  <Sparkles className="w-7 h-7 text-fuchsia-400 animate-pulse" />
                  <h2 className="text-3xl md:text-4xl font-heading font-bold text-white drop-shadow-lg">
                    Generate Your Chart
                  </h2>
                  <Sparkles className="w-7 h-7 text-fuchsia-400 animate-pulse" />
                </div>
                
                <p className="max-w-prose font-body text-white/80 text-lg leading-relaxed">
                  Enter your birth details below to unlock your personalized astrological reading. 
                  We'll create a comprehensive chart showing your planetary positions, houses, and karmic insights.
                </p>

                {/* Enhanced privacy assurance */}
                <div className="inline-flex items-center gap-2 text-white/70 bg-slate-800/30 px-4 py-2 rounded-full border border-slate-600/30 backdrop-blur-sm">
                  <Shield className="w-4 h-4 text-green-400" />
                  <span className="text-sm font-medium">Your data is secure and only used to generate your chart</span>
                </div>
              </div>

              {/* Enhanced card with better contrast */}
              <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 border-2 border-fuchsia-500/30 shadow-2xl shadow-fuchsia-500/20 backdrop-blur-sm">
                <BirthForm onSubmit={handleSubmit} initialValues={prefillValues} isSubmitting={submitting} />
              </Card>

              {/* Sample Data Buttons - enhanced styling */}
              <div className="mt-10 p-8 bg-gradient-to-br from-fuchsia-500/10 to-purple-600/10 rounded-2xl border-2 border-fuchsia-500/20 backdrop-blur-sm shadow-xl">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold text-white/90 mb-2">Don't have your birth details handy?</h3>
                  <p className="text-white/60 text-sm">Try with these famous personalities to explore the platform:</p>
                </div>
                <div className="flex justify-center">
                  <SampleButtons onSelect={handlePrefill} onNewForm={handleNewForm} />
                </div>
              </div>

              {/* Enhanced benefits preview */}
              <div className="mt-12 text-center">
                <div className="flex items-center justify-center gap-2 mb-6">
                  <TrendingUp className="w-5 h-5 text-fuchsia-400" />
                  <p className="text-white/80 text-lg font-semibold">
                    After generating your chart, you'll receive:
                  </p>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
                  <div className="bg-gradient-to-br from-fuchsia-500/20 to-purple-600/20 px-4 py-3 rounded-xl border border-fuchsia-500/30 backdrop-blur-sm">
                    <span className="text-sm font-medium text-white/90">Birth Chart Visualization</span>
                  </div>
                  <div className="bg-gradient-to-br from-fuchsia-500/20 to-purple-600/20 px-4 py-3 rounded-xl border border-fuchsia-500/30 backdrop-blur-sm">
                    <span className="text-sm font-medium text-white/90">Planetary Positions</span>
                  </div>
                  <div className="bg-gradient-to-br from-fuchsia-500/20 to-purple-600/20 px-4 py-3 rounded-xl border border-fuchsia-500/30 backdrop-blur-sm">
                    <span className="text-sm font-medium text-white/90">Karmic Insights</span>
                  </div>
                  <div className="bg-gradient-to-br from-fuchsia-500/20 to-purple-600/20 px-4 py-3 rounded-xl border border-fuchsia-500/30 backdrop-blur-sm">
                    <span className="text-sm font-medium text-white/90">Personalized Reading</span>
                  </div>
                </div>
              </div>
            </div>
          </MotionFade>
        </section>
      </div>

      <SiteFooter />
    </div>
  );
}