# Karma Aligns — Style, Animation & Sound Guide

This document defines the **design system** for the astrology app, including **style tokens, animation rules, and sound guidelines**.
It is based on the **Adaptive Cosmic Design System (v2.1)**.

---

## 1. Visual Style

### 1.1 Design Principles

* **Ritual Mode (default):** narrative, mystical, immersive.
* **Analyst Mode:** compact, table-first, reduced motion.
* **Element Accents:** Fire, Earth, Air, Water determine subtle color overlays.
* **Accessibility:** WCAG AA contrast, motion & sound respect OS preferences.

---

### 1.2 Colors (Tokens)

**Dark Mode (default):**

```css
--bg-0: #0A0B1A;   /* Deep Space */
--bg-1: #131735;   /* Surface Indigo */
--text-1: #F4F6FF; /* Primary Text */
--text-2: #A7B0D0; /* Secondary Text */
--accent-1: #A27BFF; /* Nebula Violet */
--accent-2: #57A6FF; /* Stellar Blue */
--accent-3: #FFC86B; /* Starlight Gold */
--success: #32C2A5;
--warning: #FFB84C;
--error: #FF5A5A;
--info: #4AA8FF;
--gradient-cta: linear-gradient(135deg, #A27BFF, #57A6FF, #FFC86B);
```

**Light Mode:**

```css
--bg-0: #FFFFFF;
--bg-1: #F4F6FB;
--text-1: #12121A;
--text-2: #555B6E;
--accent-1: #7E75FF;
--accent-2: #4AA8FF;
--accent-3: #FFB800;
```

**Elemental Variants:**

```css
--fire: #FF7A59;
--earth: #85D1A0;
--air: #8AB6FF;
--water: #7E8BFF;
```

---

### 1.3 Typography

* **Display Titles:** *Cormorant Garamond*, weight 600
* **Body & UI:** *Inter*, weight 400–600
* **Numeric Data:** *Fira Code* (tabular figures)

**Scale:**

* XS (12px) → captions, footnotes
* SM (14px) → labels, microcopy
* Base (16px) → body text
* MD (18px) → subheadings
* LG (22px) → section headers
* XL (28px) → page titles
* XXL (36px) → hero titles
* Display (48px) → splash hero

---

### 1.4 Spacing, Radii & Shadows

**Spacing (4pt scale):**

```
--space-1: 4px
--space-2: 8px
--space-3: 12px
--space-4: 16px
--space-5: 24px
--space-6: 32px
--space-7: 48px
```

**Radii:**

```
--radius-sm: 8px
--radius-md: 12px
--radius-lg: 20px
--radius-pill: 999px
```

**Shadows:**

```
--shadow-sm: 0 2px 6px rgba(0,0,0,0.15)
--shadow-md: 0 6px 24px rgba(162,123,255,0.18)
--shadow-glow: 0 0 12px rgba(162,123,255,0.45)
```

---

### 1.5 Components

**Buttons**

* Primary: Gradient orb, pill shape, glowing hover
* Secondary: Transparent with accent border
* Ghost: Minimal outline

**Inputs**

* Floating labels
* 48px height
* Focus: accent border + glow

**Cards**

* Glassmorphic blur
* Gradient border highlights
* Expandable for details

**Tabs**

* Swipeable
* Active tab → accent underline

**Bottom Sheet**

* Planet detail view
* 50% height (snap) → full height

**Notifications**

* Success (green), Error (red), Info (blue) banners

---

### 1.6 Backgrounds & Texture

* **Dark Mode:** Starfield gradients + subtle parallax stars
* **Light Mode:** Pastel celestial gradients
* **Element Overlays:** sparks/ripples/swirl/texture depending on element
* **Glassmorphism:** Cards & modals with blurred transparency

---

## 2. Animation Guide

### 2.1 Motion Principles

* **Subtle & purposeful**: animations enhance meaning.
* **Durations:**

  * Micro: 120ms
  * UI transitions: 240ms
  * Scenes: 420ms
* **Easing:** `cubic-bezier(.2,.7,.2,1)`
* **Reduced motion:** respect `prefers-reduced-motion`.

---

### 2.2 Interaction Patterns

* **CTA hover:** rise + glow pulse
* **Card expand:** smooth scale & fade in
* **Tab change:** underline slide + content fade
* **Bottom sheet:** slide-up with slight overshoot
* **Planet wheel:** slow oscillation; tap → glow burst

---

### 2.3 Techniques

* Animate `transform` and `opacity` (GPU-friendly).
* Idle wheel rotation: infinite, very slow.
* Parallax limited to 8–12px, disabled for reduced motion.
* Reveal on scroll: fade + translateY.

---

## 3. Sound Guide

### 3.1 Principles

* **Subtle & optional**
* **Default ON:** Ambient celestial hum
* **Sticky toggle:** 🔊 / 🔇 always visible
* **Respect OS & accessibility:** mute if motion reduced or device muted

---

### 3.2 Sound Palette

* **Ambient Bed:** low-volume cosmic hum (loop, 60–120s)
* **UI Cues:**

  * Select: glassy tick
  * Success: soft chime
  * Error: muted thud
  * Toggle: gentle click

**Mixing:**

* Ambient: -35 to -28 LUFS
* UI cues: -24 LUFS, <150ms length

---

### 3.3 Implementation Notes

* Preload small `.ogg/.mp3` files.
* Use localStorage to persist sound state.
* Pause ambient on `visibilitychange`.
* Provide Settings → Sound \[ambient, cues, volume].

---

## 4. QA & Performance Checklist

* Animations per screen ≤ 5; avoid animating layout
* Lottie JSON < 400KB per screen
* Audio < 300KB for cues, <1.5MB for ambient
* Accessible focus states on planets & tabs
* Lazy-load heavy assets
* Test on mid-tier Android & low network

---

✅ This guide ensures the app stays:

* **Mystical & immersive** (Ritual mode by default)
* **Accessible & performant** (tokens, reduced motion, WCAG)
* **Future-proof & shareable** (tokens → web, mobile, PDF, social)