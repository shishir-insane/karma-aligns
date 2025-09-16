Here’s a concise dev-to-dev handoff on the Shadbala revamp—what I built, why, and how to reuse the same UX DNA elsewhere.

# What I shipped (high level)

* **Two audiences, one UI**:

  * **Gen-Z mode (default):** normalized scores (0–1), narrative micro-stories, swipeable planet cards, dynamic “Quick Reads,” subtle gamification (levels), “Boss Mode” highlighting (≥ 0.70), and a **Spotlight** modal per planet.
  * **Classical layer (opt-in):** Rūpa/Virūpa values surfaced inline via a **“Classical values”** toggle—no layout shift, just extra text for astrologers.
* **Progressive disclosure**: collapsible section, expandable planet breakdown, tooltips for Sanskrit terms revealed on click (one open at a time).
* **Mobile-first**: horizontal swipe cards on mobile, grid on desktop; badges wrap to next line to avoid overflow; no horizontal scrolling needed for tables we render in this section.
* **Sticky mental model**: Six pillars consistently labeled with Gen-Z friendly names + Sanskrit tooltips.

# Key UX patterns (replicable)

1. **Numbers → Stories → Visuals → Interactions**

   * **Numbers**: normalized totals + per-pillar values; optional classical Rūpa/Virūpa.
   * **Stories**: “Quick Reads” compares strongest planets and Sun↔Moon (“feelings > ego”).
   * **Visuals**: Strength ring (conic progress), mini radar for 6 pillars, glow/pulse on strong values.
   * **Interactions**: Spotlight modal (tap planet), swipeable cards, collapsible breakdown, one-time nudge.

2. **Boss Mode affordance**

   * **Threshold**: ≥ 0.70 normalized → “Very strong • Boss Mode”.
   * **Affordances**: green ring glow, 👑 chip on the planet, “Boss pillar” chip on any pillar ≥ 0.70, top card halo.
   * **Dynamic tips**: “Power cluster…” when 3+ planets are Boss; planet-specific nudges when a single planet dominates.

3. **Classical compatibility without scaring casuals**

   * A **toggle** adds Rūpa/Virūpa inline to the same lines—no new tables.
   * Sanskrit concepts hidden behind **clickable “?”** tooltips; one open at a time, dismiss on click-away.

4. **Progressive disclosure & persistence**

   * **Collapsible section** (state persisted via `localStorage`).
   * **Classical toggle** persisted too.
   * **One-time nudge** (“Tap for Spotlight ↗”) persisted after first open.

# Technical building blocks (drop-in patterns)

* **Components**

  * `Shadbala.tsx` (section wrapper; collapse & classical toggle, layout)
  * `PlanetCard` (per-planet ring + radar + breakdown)
  * `PillarRow` (6 rows, tooltip + bar + badge + classical inline)
  * `StrengthRing` (conic meter + pulse on strong)
  * `SpotlightModal` (What-If copy, life-areas chips, classical totals)
  * `ComparisonsStories` (Spotify-style deltas + **dynamic, context-aware tip**)
  * `RadarChart` (6-axis polygon; lightweight SVG)
* **Hooks / utils**

  * `usePersistentToggle`, `usePersistentFlag` → `localStorage` backed UX state
  * `useOneTimeNudge` → “discoverability” hint that disappears forever after first use
  * `useInView` → animate/charge visuals when cards enter viewport
  * `badgeAbsolute()` → centralizes thresholds, text, and **isBoss** flag
  * `extractShadbala()` → **NEW+OLD** API shape compatible (normalized + virupa/rupa)
* **Data contracts supported**

  * `data.shadbala.components.normalized[planet][pillar]`
  * `data.shadbala.components.virupa_rupa[planet]` (components + totals)
  * `data.shadbala.totals.normalized[planet]`
  * Legacy: `data.shadbala.components[planet]`, `data.shadbala.total[planet]`

# How to replicate in other sections

Use the same 4-layer recipe, plus Boss Mode when meaningful:

1. **Ashtakavarga**

   * **Numbers**: normalized or total bindus per planet/house.
   * **Stories**: “Your 11th house (gains) is peaking vs 5th (joy/creativity). Expect collabs > solo play.”
   * **Visuals**: house wheel heatmap (12-spoke), per-house bars.
   * **Interactions**: tap a house → Spotlight with themes, “What if strong/weak,” classical verse optional.

2. **Planetary Positions (table)**

   * **Numbers**: sign, degree, nakshatra pada, dignity.
   * **Stories**: small badges—Exalted/Own/Friendly/Enemy/Debilitated with color coding.
   * **Visuals**: sign glyphs, subtle glow for dignities; progress bar for degree within sign.
   * **Interactions**: row click → Spotlight: “What this placement means today”; tooltips for dignity math.

3. **Yogas (from kundli\_predictions)**

   * **Numbers**: strength/confidence if provided.
   * **Stories**: short headline (“Dhana Yoga → wealth timing favored”).
   * **Visuals**: card per yoga with iconography; tag chips (Wealth, Fame, Learning).
   * **Interactions**: expand for classical reference + modern interpretation; bookmark/favorite.

4. **ACG (astrocartography)**

   * **Numbers**: top 3 cities by Jupiter/Venus lines near user’s lat/lon.
   * **Stories**: “Venus line through Lisbon → social glow & creative collabs.”
   * **Visuals**: mini map snapshot + city chips.
   * **Interactions**: tap a city → modal with do/don’t, time to visit, “What if now?”

# Accessibility & responsiveness

* Mobile-first layout; swipe lists (`snap-x`) for dense content.
* Keyboard access on clickable cards (focus ring).
* Text contrast maintained (indigo/black background + white/70 copy).
* Tooltips open on **click** (not hover) → mobile-friendly; one open at a time; click-away to dismiss.

# Performance notes

* All charts are **SVG** + Tailwind gradients—no heavy libs.
* IntersectionObserver gates animations until in-view.
* Minimal state; persistence via `localStorage`.
* No third-party deps added.

# Theming & thresholds

* **Boss Mode**: ≥ 0.70 normalized (tunable in `badgeAbsolute`).
* Secondary thresholds: 0.55–0.70 “Holding Steady”, 0.40–0.55 “Needs a Boost”, < 0.40 “Needs Support”.
* Keep the palette consistent: emerald for Boss, violet/fuchsia for neutrals, amber/rose for weak.

# Copy system (extendable)

* Planet “What-If” text and life-area tags live in a simple map (`WHAT_IF`).
* Add/translate copy per section the same way (e.g., houses, yogas).
* Keep **micro-stories** short, present-tense, and relatable (fitness, gaming, Spotify metaphors).

# Integration checklist (for any new section)

* [ ] Data extractor: accept NEW and legacy shapes.
* [ ] Default to normalized for Gen-Z; optional classical toggle.
* [ ] Spotlight modal with: ring/heat, level, what-if, areas, classical stats.
* [ ] Quick Reads: 2–3 story cards + dynamic tip (context-aware).
* [ ] Boss Mode affordances if thresholds make sense.
* [ ] Collapsible wrapper; store open/closed in `localStorage`.
* [ ] Tooltips on click; one open at a time.
* [ ] Swipe on mobile, grid on desktop.
* [ ] a11y: labels, focus ring, aria-expanded on toggles.

# Future ideas (optional backlog)

* Compare mode: allow “pin” of a planet across sections.
* User-tuned thresholds (advanced settings).
* Time slider (transits) to see Boss Mode shift over months.
* Achievement feed (“Unlocked Boss Mode Saturn this quarter”).

If you mirror these patterns—**story cards, spotlight modal, boss highlighting, classical toggle**—across Ashtakavarga, Positions, Yogas, and ACG, the app will feel coherent and delight both **Gen-Z readers** and **classical practitioners** without forking the UI.
