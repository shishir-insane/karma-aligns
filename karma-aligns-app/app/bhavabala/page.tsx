"use client";

import React from "react";
import { H2 } from "@/components/ui/Type";
import "@/app/globals.css";
import Link from "next/link";

export default function BhavaBalaInfoPage() {
    return (
        <section className="p-4 sm:p-6 max-w-3xl mx-auto space-y-8">
            <div className="flex items-center justify-end">
                <Link
                    href="/results#bhavabala"
                    className="text-xs rounded-xl border border-white/10 px-3 py-1.5 hover:bg-white/5 text-white/80"
                    aria-label="Back to results • Bhava Bala"
                >
                    Close
                </Link>
            </div>

            {/* Hero */}
            <div className="heading-shadow-container" data-text="Bhava Bala">
                <H2 className="hero-heading">Bhava Bala</H2>
            </div>
            <p className="text-white/80 text-lg">
                Bhava Bala is like checking which “rooms” in your life have
                the lights on brightest right now. 🔦
            </p>

            {/* Why it matters */}
            <div className="ka-card p-5 ka-card-hover">
                <h3 className="font-heading text-lg mb-2">Why care?</h3>
                <p className="text-white/70 text-sm leading-relaxed">
                    Each house in your chart = one area of life (career, love, health,
                    etc). Bhava Bala shows which ones are vibing strong and which ones are
                    kinda low-battery. Think of it as a cosmic “strength meter” for your
                    life sectors.
                </p>
            </div>

            {/* The two pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="ka-card p-4 ka-card-hover">
                    <h4 className="font-medium text-white mb-1">Support Power ✨</h4>
                    <p className="text-white/70 text-sm">
                        aka <b>Bhāva Drik</b>. It’s about how many planets are backing up
                        that house with aspects. More cosmic hype squad = more juice.
                    </p>
                </div>
                <div className="ka-card p-4 ka-card-hover">
                    <h4 className="font-medium text-white mb-1">Placement Power 📍</h4>
                    <p className="text-white/70 text-sm">
                        aka <b>Kendradhi</b>. This is about where the house lands: prime
                        locations (like Kendra) give it stage-lights, awkward spots (like
                        Apoklima) dim it down.
                    </p>
                </div>
            </div>

            {/* How to read */}
            <div className="ka-card p-5 ka-card-hover">
                <h3 className="font-heading text-lg mb-2">How to read it 👀</h3>
                <ul className="text-white/70 text-sm list-disc pl-5 space-y-1">
                    <li>
                        <b>Boss Mode (≥0.70)</b>: This house is lit. Make moves here.
                    </li>
                    <li>
                        <b>Holding Steady (0.55–0.69)</b>: Solid, dependable. Safe zone.
                    </li>
                    <li>
                        <b>Needs a Boost (0.40–0.54)</b>: Meh. Needs effort to shine.
                    </li>
                    <li>
                        <b>Needs Support (&lt;0.40)</b>: Chill. Don’t push too hard here.
                    </li>
                </ul>
            </div>

            {/* Why GenZ should care */}
            <div className="ka-card p-5 ka-card-hover">
                <h3 className="font-heading text-lg mb-2">Okay but… what’s in it for me? 🤔</h3>
                <p className="text-white/70 text-sm leading-relaxed">
                    Bhava Bala = dashboard for your vibe allocation.
                    Wanna know why career’s popping but love life feels ghosted?
                    Check the scores. It’s not “destiny” locked — it’s a cosmic mood ring
                    showing where the universe says “yup, flow” vs. “nah, rest.”
                </p>
            </div>

            {/* Footer nudge */}
            <p className="text-center text-sm text-white/60 mt-8">
                TL;DR: Bhava Bala is the cheat-sheet for which life chapters have plot
                armor right now. Use it to spend your energy where it pays off.
            </p>
        </section>
    );
}
