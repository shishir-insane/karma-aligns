# 🔑 Handover Notes: Shadbala & BhavaBala UI/UX DNA

This doc is the **handoff between developers** for the Shadbala and BhavaBala modules.
It captures *what we built, why we built it that way, and how to reuse the same UX DNA* across future modules.

---

## 🌌 Two Audiences, One UI

* **Gen-Z Mode (default)**

  * Normalized scores (0–1)
  * Micro-stories (“Quick Reads”)
  * Swipeable cards (mobile-first)
  * Dynamic Boss Mode highlighting (≥0.70)
  * Spotlight modal per planet/house with “What-If” copy
* **Classical Mode (toggle)**

  * Inline Rūpa/Virūpa values
  * Sanskrit terms surfaced
  * Tooltips for deeper learning

---

## 🧩 UX Patterns (Core DNA)

### 1. **Numbers → Stories → Visuals → Interactions**

* **Numbers**: normalized totals, per-pillar values (Shadbala: 6 pillars, BhavaBala: 2 pillars), optional classical values.
* **Stories**: Quick Reads summarizing strongest vs weakest comparisons.
* **Visuals**: conic strength ring, mini-radar (Shadbala), 12-spoke wheel (BhavaBala).
* **Interactions**: Spotlight modal, swipeable cards, collapsible details, one-time nudges.

### 2. **Boss Mode Affordance**

* **Threshold**: ≥ 0.70 → Boss Mode.
* **Affordances**: emerald glow (card + ring), 👑 chip, “Boss” scale badge, halo highlight.
* **Dynamic tips**: cluster messages if 3+ Boss planets/houses, or specific nudges when one dominates.

### 3. **Progressive Disclosure**

* Cards show only **ring + one-liner + scale badge** by default.
* Details (pillar bars, benefic/malefic, classical totals) are hidden in a **Show details** fold or Spotlight.
* Keeps parity with Shadbala: subtle, roomy cards with depth available on tap.

### 4. **Mobile-First**

* Default: horizontal swipe (`flex + snap-x`)
* Desktop: grid (Shadbala → planet grid; BhavaBala → 3 cols)
* Text/icons wrap, no overflow.
* Spotlight/Modal: mobile-friendly with click-to-open tooltips (no hover dependencies).

---

## 🎨 Visual + Copy System

* **Color Palette**

  * Boss → Emerald
  * Holding Steady → Violet/Fuchsia
  * Needs Boost → Amber
  * Needs Support → Rose

* **Scale Badges**

  * Shadbala + BhavaBala both use text-coded badges with above colors, e.g.

    * “Very strong • Boss Mode” (emerald)
    * “Average to good • Holding Steady” (violet)
    * “Weak • Needs a Boost” (amber)
    * “Very weak • Needs Support” (rose)

* **Micro-Stories**

  * Always 3 Quick Reads.
  * Shadbala: strongest planets, Sun↔Moon egos/feelings.
  * BhavaBala: house axis comparisons (1↔7, 4↔10, 5↔11).

* **Explaners**

  * Section footers explain *what the measure is*, *how it’s calculated*, and *how to read the scale* in **Gen-Z language** (with Sanskrit shown only when toggle on).

---

## 🛠 Technical Building Blocks

### Components (shared patterns)

* **Section wrapper**: collapse toggle, classical toggle, view switch (wheel/grid), compare mode.
* **Card**: minimal layout → ring, scale badge, micro-story, CTA (“View breakdown”).
* **StrengthRing**: conic SVG, emerald pulse for Boss.
* **QuickReads**: rail of 3 cards with micro-stories.
* **SpotlightModal**: breakdowns, classical totals, What-If copy, tags.
* **Tooltip**: click-to-open, mobile-friendly.

### Hooks

* `usePersistentToggle` / `usePersistentFlag` → localStorage backed toggles.
* `useOneTimeNudge` → discoverability hints.
* `useInView` → animate rings/cards only when scrolled into view.

### Data Contracts

* **Shadbala**:

  * `data.shadbala.components.normalized[planet][pillar]`
  * `data.shadbala.virupa_rupa[planet]`
* **BhavaBala**:

  * `data.bhava_bala.normalized[house]`
  * `data.bhava_bala.virupa_rupa[house]`
  * `data.bhava_bala.legacy_counts[]`

---

## 📐 Layout Notes

* Cards sized consistently across rows (min-heights reserved so micro-stories don’t cause taller cards).
* Scale badges align right in header, titles left.
* Spotlight opens with consistent layout: header (title + badge), ring + breakdowns, What-If, chips.

---

## 🧭 Replication Guide

When building new sections (e.g., **Ashtakavarga**, **Yogas**, **ACG**):

1. Extract data into normalized + classical.
2. Provide 3 Quick Reads stories based on comparisons.
3. Show ring/wheel visual.
4. Add scale badge with thresholds.
5. Keep cards minimal; push details into Spotlight or Details fold.
6. Add Explain-it footer for Gen-Z clarity.

---

## 🔮 Future Ideas

* Compare mode across planets/houses side-by-side.
* Time slider (transits) to see Boss shifts.
* Achievement feed (“Unlocked Boss House 10 this month”).
* User-tunable thresholds.

---

👉 **Key takeaway for devs**: Always honor the **UX DNA** → *Numbers → Stories → Visuals → Interactions* with Boss Mode, classical toggle, and mobile-first swipe/grid. That keeps the product consistent, approachable for casuals, but still deep for astrologers.


Would you like me to create a **shared design tokens + component map** (e.g., ka/ui/Badge, ka/ui/StrengthRing, ka/ui/SpotlightModal) so Shadbala and BhavaBala truly share one codebase instead of parallel ones? That would lock in the DNA for all future modules.