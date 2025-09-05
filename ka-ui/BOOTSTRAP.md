# BOOTSTRAP.md — Karma Aligns (UI)

## 0) Project snapshot

* **Stack**: Next.js 15 (App Router) · TypeScript · Tailwind **v4** · shadcn/ui · Radix · Framer Motion · React Leaflet
* **Design**: Atomic, token-driven, accessible. “Celestial minimalism” (glass surfaces, rounded-2xl, soft shadows).
* **Pages shipped**: ACG (map) `/acg` and ACG → Cities `/acg/cities`.
* **Key conventions**: Fixed section widths/heights (no layout shift), SSR-safe providers, ETag fetch client, typed hooks.

---

## 1) Tailwind v4 + Tokens

**`app/globals.css` essentials**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* HSL/OKLCH tokens (light + dark) already defined) */

/* Helper utilities (required by pages) */
.glass { @apply bg-surface/70 backdrop-blur border border-border; }
.section { @apply rounded-2xl bg-surface/70 backdrop-blur border border-border; }

/* Base */
@layer base {
  * { @apply border-border outline-ring/50; }
  body { @apply bg-background text-foreground antialiased; }
}
```

We use standard utilities (`bg-surface/70`, `border-border`, `backdrop-blur`) and the helpers above (`glass`, `section`) to keep styles consistent.

---

## 2) shadcn/ui theming (tokens)

* Button, Tabs, Tooltip, Card are themed to **primary = electric blue** (token-driven), focus ring via `--ring`.
* Tabs use custom triggers with animated underline; accessible keyboard nav via Radix.

---

## 3) App shell & providers

### `components/layout/page-scaffold.tsx`

Reusable shells for consistent look:

```tsx
export function Page({ children, className }: Props) { return <div className="space-y-6 {className}">{children}</div> }
export function PageHeader({ title, subtitle, actions }: Props) { /* shared header */ }
export function SectionCard({ children, header, className }: Props) {
  return <section className={`rounded-2xl border border-border bg-surface/70 backdrop-blur ${className||""}`}>
    {header && <div className="px-3 py-2 md:px-4 md:py-3 border-b border-border rounded-t-2xl">{header}</div>}
    <div className="p-3 md:p-4">{children}</div>
  </section>
}
```

### `components/providers/chart-provider.tsx` (SSR-safe)

* Holds **three presets** (Sample A/B/C).
* **No localStorage on first render** (prevents hydration mismatch).
* After mount: hydrates from `localStorage` and updates selection.
* Exposes: `presets`, `selectedId`, `meta`, `selectPreset(id)`, `setMeta(patch)`, `setPresets()`.

Usage:

```tsx
const { meta, selectPreset } = useChartMeta()
/* meta contains dob, tob, tz (offset), lat, lon, ayanamsa, hsys */
```

---

## 4) Fetch client + API base

### `lib/api-client.ts`

* `fetchJSON<T>(url, params?, init?)` — minimal client with **ETag** caching:

  * Memorizes `{etag,data}` in memory.
  * Sends `If-None-Match`; on 304 returns cached data.
* **Base URL**: if you use a proxy, call `fetchJSON("/api/v1/...")`.
  If you hit the backend directly, set:

```ts
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || ""
// then use fetchJSON(`${API_BASE}/api/v1/acg`, params)
```

**Exports** (wrappers we rely on):

```ts
export const api = {
  symbols: () => fetchJSON("/api/v1/symbols"),
  grahas: (chart_id: string) => fetchJSON("/api/v1/grahas", { chart_id }),
  rashi:  (chart_id: string) => fetchJSON("/api/v1/charts/rashi", { chart_id }),
  dasha:  (chart_id: string) => fetchJSON("/api/v1/dasha", { chart_id }),
  aspects:(chart_id: string) => fetchJSON("/api/v1/aspects", { chart_id }),
  varshaDetails:(chart_id: string, varsha_year?: number) =>
    fetchJSON("/api/v1/varsha/details", { chart_id, varsha_year }),
}
```

**ACG Cities**:

```ts
export type ACGCityHit = { planet: string; angle: string; distance_km: number; advice: string|null }
export type ACGCityRow = { key: string; name: string; country: string; lat: number; lon: number;
  chart_id?: string; planet?: string|null; angle?: string|null; distance_km?: number|null; advice?: string|null }

export async function fetchAcgCities(params:{dob?:string;tob?:string;tz?:string;lat?:number;lon?:number}):Promise<ACGCityRow[]>
```

---

## 5) ACG map page (`/acg`)

* **Data**: `GET /api/v1/acg` → normalized by `normalizeAcg()` to:

  * `lines: { [planet]: { [type]: Array<{lat,lon}> } }`
  * `advice: { [theme]: string[] }`
* **Visuals**: React-Leaflet `MapContainer` (dynamic import), OSM tile layer.
* **Legend**: Planet toggles + angle toggles (ASC/MC/DSC/IC).
  Helpers: `getPlanetColor(name)`, `getPlanetGlyph(name)`, `getLineStyle(type)`.

**Layout** (consistent with Cities):

* `PageHeader` → `SectionCard` (How-to) → `SectionCard` (Legend) → grid:

  * Left: Advice (Tabs + fixed height scroll)
  * Right: Map (fixed height, no width shift)
* Floating `ACGFilterBar` (Advice filter: all/positive/caution).

**“How to read” collapsible** matches Cities content (angles, distance guidance, cues).

---

## 6) ACG → Cities page (`/acg/cities`)

* Calls `fetchAcgCities({ dob,tob,tz,lat,lon })` using **selected preset**.
* Renders `CitiesTable` (TanStack Table v8):

  * Filters: country, city, planet (equals), angle (equals), hits-only, max distance.
  * Sort: default by distance ↑, click headers to toggle.
  * Uses `flexRender` for cells/headers (v8 API).

**Shared “How to read this table”** (`components/acg/cities-howto.tsx`)

* Planet/angle primers, distance interpretation, workflows (e.g., Career = MC + Sun/Jupiter).
* **Planet cues** shared via `lib/planet-cues.ts` and styled with `getPlanetColor/Glyph`.

---

## 7) Planet styles & glyphs

**`lib/acg.ts` key exports**

```ts
export const PLANET_COLORS: Record<string,string> // brand palette per planet
export const PLANET_GLYPHS: Record<string,string> // UTF glyphs
export function getPlanetColor(name:string): string
export function getPlanetGlyph(name:string): string
export type LineType = "ASC"|"MC"|"DSC"|"IC"|string
export function getLineStyle(t: LineType): { weight: number; dashArray?: string }
```

**`lib/planet-cues.ts`**: `PLANET_CUES` with positive/caution blurbs for
Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto, Rahu.

---

## 8) UI atoms used by ACG

* `components/acg/legend.tsx` — chips to toggle planets/angles (consumes `PLANET_COLORS/GLYPHS`).
* `components/acg/filter-bar.tsx` — advice filter (all/positive/caution).
* `components/ui/tabs.tsx` — Radix wrapper (animated underline; accessible).
* `components/ui/button.tsx`, `card.tsx`, `input.tsx`, `select.tsx`, `tooltip.tsx` — shadcn primitives themed to tokens.

---

## 9) App shell polish

* **Topbar** shows **BirthSwitcher** + **BirthSummary** using `useChartMeta()`; user can pick Sample A/B/C (stored in localStorage after mount).
* **AnimatedFavicon** rotates `karma-wheel.svg` subtly (prefers-reduced-motion respected).
* **Sidebar** includes ACG and ACG → Cities entries.

---

## 10) Known pitfalls & fixes

* **Hydration mismatch**: never read `localStorage` in initial state. Our `ChartProvider` hydrates selection in `useEffect`.
* **TanStack v8 API**: use `flexRender(...)`. No `cell.render()` or `setFilterFn()` at runtime — define `filterFn` in column defs.
* **Tailwind unknown class**: define `.glass`/`.section` in `globals.css` or inline their utilities.
* **API base**: set `NEXT_PUBLIC_API_BASE` if you’re not proxying `/api` to backend.
* **Leaflet SSR**: `MapContainer` must be dynamic with `ssr:false`.

---

## 11) How to start a **new chat** with this bootstrap

Paste this at the top of the new chat:

> “Same Karma Aligns app. See attached `BOOTSTRAP.md` for stack, tokens, and key components. We’re editing `<path/to/file>`. Here’s the error/screenshot: …”

Optionally attach any files you want me to modify (e.g., `app/acg/page.tsx`, `lib/acg.ts`).

---

## 12) Quick commands

```bash
# dev
pnpm dev

# build (Turbopack)
pnpm build

# add shadcn primitives if missing
pnpm dlx shadcn-ui@latest add accordion tooltip card button input select tabs
```

---

## 13) Minimal code map (ACG feature)

```
app/
  acg/page.tsx                # Map page (glass sections, legend, advice)
  acg/cities/page.tsx         # Cities table page (same scaffold)
components/
  layout/page-scaffold.tsx    # Page, PageHeader, SectionCard
  providers/chart-provider.tsx # SSR-safe presets + selection
  acg/legend.tsx              # Planet/angle toggles
  acg/filter-bar.tsx          # Advice filter
  acg/cities-table.tsx        # TanStack Table v8 with filters/sort
  acg/cities-howto.tsx        # Collapsible guide (shared tone)
lib/
  api-client.ts               # fetchJSON + wrappers + fetchAcgCities
  acg.ts                      # colors, glyphs, line styles
  acg-normalize.ts            # backend → UI shape
  planet-cues.ts              # positive/caution blurbs for planets
public/
  karma-wheel.svg             # favicon/brand mark (AnimatedFavicon)
```

---