'use client';

import React, { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from "next/navigation";
import SiteHeader from './SiteHeader';
import SiteFooter from './SiteFooter';
import { ChevronDown, ArrowUp, Star, Shield, Clock, Users, CheckCircle, Zap, Eye, Lock } from 'lucide-react';
import { BirthFormValues } from './BirthForm';
import Hero from './Hero';
import TrustStrip from './TrustStrip';
import ChartForm from './ChartForm';
import DemoProfiles from './DemoProfiles';
import ValueGrid from './ValueGrid';
import PreviewSection from './PreviewSection';
import FloatingCTA from './FloatingCTA';
import { saveCompute } from "@/components/utils/resultsStore";

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
  const [viewerCount, setViewerCount] = useState(127);
  const [timeLeft, setTimeLeft] = useState({ hours: 23, minutes: 47, seconds: 32 });
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduceMotion(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  // Viewer count animation
  useEffect(() => {
    const interval = setInterval(() => {
      setViewerCount(prev => Math.max(89, prev + Math.floor(Math.random() * 3) - 1));
    }, 3000 + Math.random() * 2000);

    return () => clearInterval(interval);
  }, []);

  // Countdown timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);

    return () => clearInterval(timer);
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

  // v is your BirthFormValues; adapt names if yours differ
  const handleSubmit = async (v: {
    name?: string;
    date: string;
    time: string;
    tz: string;
    location: string;
    lat?: string | number;
    lon?: string | number;
  }) => {
    setError(null);
    setSubmitting(true);
    try {
      const payload: any = {
        ...v,
        dob: v.date,
        tob: v.time,
        lat: v.lat != null ? Number(v.lat) : undefined,
        lon: v.lon != null ? Number(v.lon) : undefined,
      };
      delete payload.date; delete payload.time;

      const res = await fetch("/api/v1/compute", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      const data = (() => { try { return JSON.parse(text); } catch { return text; } })();

      if (!res.ok) {
        const msg =
          typeof data === "string"
            ? data
            : data?.error?.message || data?.detail || `Compute failed (${res.status})`;
        throw new Error(msg);
      }

      // Save both the user input (original UI shape is handy) and result
      saveCompute(v, data);

      // Navigate with a tiny cache-buster so Results mounts fresh in App Router
      const rid = Date.now().toString();
      router.push(`/results?rid=${rid}`);
    } catch (e: any) {
      setError(e?.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };


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

  function scrollToId(id: string) {
    const el = document.getElementById(id);
    if (!el) return;

    const header = document.querySelector("header") as HTMLElement | null;
    const headerH =
      (header?.offsetHeight ?? parseInt(getComputedStyle(document.documentElement).getPropertyValue("--ka-header-h")) || 72)
      + 12; // gap

    const rect = el.getBoundingClientRect();
    const y = rect.top + window.scrollY - headerH;

    // clamp to avoid scrolling past the bottom (footer whitespace)
    const max = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo({ top: Math.min(y, max), behavior: "smooth" });
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

      {/* Warning Hook Banner */}
      {/* <div className="relative z-20 bg-gradient-to-r from-red-600/90 to-orange-500/90 backdrop-blur-md border-b border-orange-400/30">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-center text-center">
            <Zap className="w-4 h-4 text-yellow-300 mr-2 animate-pulse" />
            <p className="text-white text-sm font-medium">
              ⚠️ Current cosmic window closes in: {String(timeLeft.hours).padStart(2, '0')}:
            {String(timeLeft.minutes).padStart(2, '0')}:
            {String(timeLeft.seconds).padStart(2, '0')}. These readings may completely change how you see yourself and your destiny.
            </p>
          </div>
        </div>
      </div> */}

      {/* Live Viewer Count */}
      {/* <div className="fixed top-20 right-4 z-50 bg-green-500/20 backdrop-blur-md border border-green-400/30 text-green-300 px-3 py-1 rounded-full text-xs">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span>{viewerCount} people viewing now</span>
        </div>
      </div> */}

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
        {/* Urgency Timer */}
        {/* <div className="content-center items-center bg-red-500/20 backdrop-blur-md border border-red-400/30 text-red-300 px-4 py-2 rounded-full mb-6">
          <Clock className="w-4 h-4 mr-2" />
          <span className="text-sm font-medium">
            Current cosmic window closes in: {String(timeLeft.hours).padStart(2, '0')}:
            {String(timeLeft.minutes).padStart(2, '0')}:
            {String(timeLeft.seconds).padStart(2, '0')}
          </span>
        </div> */}
        <TrustStrip />
        {/* Testimonial Carousel */}
        <div className="w-full bg-black/30 backdrop-blur-sm border-t border-b border-white/10 py-3">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 max-w-2xl mx-auto mb-8 mt-8">
            <div className="flex items-center justify-center mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <blockquote className="text-gray-300 italic text-lg mb-4">
            "I was skeptical, but the daily horoscopes are spot-on. It's the perfect way to align my day with the stars. 10/10 recommend for my Gen-Z fam!"
            </blockquote>
            <cite className="text-fuchsia-300 font-medium"> Kavya Mehta, Los Angeles</cite>
          </div>
        </div>
        {/* Guarantee */}
        {/* <p className="text-sm text-gray-400 mt-4">
          <CheckCircle className="w-4 h-4 text-green-400 inline mr-1" />
          100% Satisfaction Guaranteed or Your Reading is Free
        </p> */}
        {/* Scarcity Section */}
        <section className="bg-gradient-to-r from-orange-500/10 to-red-500/10 backdrop-blur-md border-y border-orange-400/20 py-8 mb-16">
          <div className="container mx-auto px-4 text-center">
            <div className="flex flex-wrap justify-center items-center gap-8 text-orange-200">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-orange-400 animate-pulse" />
                <span>Your current planetary transits won't repeat for 12 years</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-400" />
                <span>Limited cosmic windows for maximum clarity</span>
              </div>
            </div>
          </div>
        </section>
        <section id="birth-form" ref={formRef} className="container mx-auto py-16 px-4">

          <ChartForm onSubmit={handleSubmit} initialValues={prefillValues} isSubmitting={submitting} />
          {error && (
            <p className="mt-4 text-sm text-rose-300">
              {error}
            </p>
          )}
          <DemoProfiles onSelect={handlePrefill} onNewForm={handleNewForm} />
          <ValueGrid />
          <PreviewSection wheelSrc={wheelSrc} />
        </section>
      </div>
      {/* Additional Social Proof */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-white mb-8">Join Thousands Who've Transformed Their Lives</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { name: "Aarya Sharma", location: "Pune, India", quote: "This website is a game-changer! My birth chart insights were so accurate and the interface is super aesthetic. It's like having a personal cosmic guide in my pocket." },
            { name: "Rohan Patel", location: "Surat, India", quote: "Found my life purpose at 45! The career guidance was spot-on and life-changing." },
            { name: "Priya Lalwani", location: "Sydney, Australia", quote: "Never knew Vedic astrology could be this cool. The app's design is amazing and the predictions are eerily precise. It's a must-have for anyone on a spiritual journey." },
            { name: "Arjun Talwar", location: "New York, USA", quote: "Forget generic horoscopes. This application provides legit, personalized guidance. It helped me understand my strengths and challenges in a whole new way. Definitely worth it!" },
            { name: "Diya Choudhury", location: "Lucknow, India", quote: "This application helped me understand my chart and my life's purpose in a way no other app has. The cosmic calendar is a lifesaver. It’s authentic and super helpful." },
            { name: "Vishal Singh", location: "Guwahati, India", quote: "I've tried a lot of astrology websites, but this one is the real deal. The details are incredible and the explanations are easy to understand. It’s my go-to for all things spiritual." }
          ].map((testimonial, index) => (
            <div key={index} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6">
              <div className="flex items-center justify-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <blockquote className="text-gray-300 italic mb-4">
                "{testimonial.quote}"
              </blockquote>
              <cite className="text-fuchsia-300 font-medium">
                — {testimonial.name}, {testimonial.location}
              </cite>
            </div>
          ))}
        </div>
      </section>
      {/* Final CTA with Urgency */}
      <section className="bg-gradient-to-r from-fuchsia-600/20 to-purple-600/20 backdrop-blur-md border-y border-fuchsia-400/30 py-16">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-4xl font-bold text-white mb-4">
            Don't Let This Cosmic Window Close
          </h3>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Your current planetary alignment offers unique insights available only for the next {timeLeft.hours} hours.
            After that, you'll have to wait months for similar cosmic clarity.
          </p>
          <button
            onClick={scrollToForm}
            className="bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-400 hover:to-purple-500 text-white px-12 py-4 rounded-full text-xl font-bold shadow-2xl hover:shadow-fuchsia-500/25 transition-all duration-300 hover:scale-105"
          >
            Claim My Reading Now
          </button>
        </div>
      </section>

      {/* Sticky floating CTA, visible after 40% scroll, hidden when the form is on screen */}
      <FloatingCTA targetId="birth-form" showAfter={0.4} />

      <SiteFooter />
    </div>
  );
}