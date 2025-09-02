"use client"

import { cn } from "@/lib/utils"

// If you already have shadcn Accordion, use it:
import {
    Accordion,
    AccordionItem,
    AccordionTrigger,
    AccordionContent,
} from "@/components/ui/accordion"
import { PLANET_CUES } from "@/lib/planet-cues"
import { getPlanetColor, getPlanetGlyph } from "@/lib/acg"

// If you *don't* have Accordion, uncomment this minimal fallback:
// function FallbackAccordion({ children }: { children: React.ReactNode }) {
//   return <details className="rounded-xl border border-border bg-surface/70 p-3">{children}</details>
// }
// const Accordion = ({ children }: any) => <div>{children}</div>
// const AccordionItem = ({ children }: any) => <div className="mb-2">{children}</div>
// const AccordionTrigger = ({ children }: any) => (
//   <summary className="cursor-pointer text-sm font-medium">{children}</summary>
// )
// const AccordionContent = ({ children }: any) => <div className="mt-2 text-sm">{children}</div>

export default function CitiesHowTo({ className }: { className?: string }) {
    return (
        <div className={cn("rounded-2xl border border-border bg-surface/60 backdrop-blur p-3 md:p-4", className)}>
            <Accordion type="single" collapsible defaultValue="howto">
                <AccordionItem value="howto">
                    <AccordionTrigger className="text-sm">
                        How to read “Cities near your astrocartography lines”
                    </AccordionTrigger>
                    <AccordionContent className="text-sm leading-relaxed text-text/80">
                        <div className="space-y-3">
                            <p>
                                This table lists cities that sit close to your <strong>astrocartography lines</strong>. Each row
                                shows a city and — if present — the <em>planet</em>, the <em>angle</em> (<code>ASC</code>, <code>MC</code>, <code>DSC</code>, <code>IC</code>), and the
                                <em> distance</em> to the nearest line in kilometers.
                            </p>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="rounded-lg border border-border p-3">
                                    <p className="font-medium mb-1">Angles · what they suggest</p>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li><code>MC</code> (Midheaven): career, public image, direction.</li>
                                        <li><code>ASC</code> (Ascendant): identity, visibility, fresh starts.</li>
                                        <li><code>DSC</code> (Descendant): partnerships, collaboration, clients.</li>
                                        <li><code>IC</code> (Imum Coeli): home, family, foundations.</li>
                                    </ul>
                                </div>
                                <div className="rounded-lg border border-border p-3">
                                    <p className="font-medium mb-1">Distance · how close is “close”?</p>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li>
                                            <strong>&lt; 100 km</strong>: strong influence; you’ll likely feel it.
                                        </li>
                                        <li>
                                            <strong>100–300 km</strong>: moderate; themes are present but blended.
                                        </li>
                                        <li>
                                            <strong>&gt; 300 km</strong>: mild background influence.
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            <div className="rounded-lg border border-border p-3">
                                <p className="font-medium mb-2">Planet quick cues</p>
                                <ul className="grid sm:grid-cols-2 gap-2">
                                    {PLANET_CUES.map((p) => (
                                        <li key={p.name} className="flex items-start gap-2 rounded-lg bg-muted/20 p-2">
                                            <span
                                                className="mt-[2px] text-base leading-none"
                                                style={{ color: getPlanetColor(p.name) }}
                                                aria-hidden
                                            >
                                                {getPlanetGlyph(p.name)}
                                            </span>
                                            <div className="min-w-0">
                                                <div className="text-sm font-medium">{p.name}</div>
                                                <div className="text-xs text-text/80">
                                                    <span className="text-text/70">+</span> {p.positive}
                                                </div>
                                                <div className="text-xs text-text/80">
                                                    <span className="text-text/70">–</span> {p.caution}
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="rounded-lg border border-border p-3">
                                    <p className="font-medium mb-1">Filters — recommended workflows</p>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li>
                                            Planning a career move? Filter <code>Angle = MC</code>, then sort by <em>Distance</em> ↑ and scan <strong>Sun/Jupiter</strong> first.
                                        </li>
                                        <li>
                                            Looking for relationship-friendly places? Filter <code>Angle = DSC</code> and planet <strong>Venus</strong>.
                                        </li>
                                        <li>
                                            Sensitive to stress? Toggle <em>Hits only</em>, set <em>Max km</em> ≤ 150, and deprioritize <strong>Mars</strong>/<strong>Saturn</strong>/<strong>Pluto</strong>.
                                        </li>
                                    </ul>
                                </div>
                                <div className="rounded-lg border border-border p-3">
                                    <p className="font-medium mb-1">Reading “Advice”</p>
                                    <p>
                                        Short notes derived from the line’s symbolism. Treat as <em>context</em>, not fate. Strong “caution”
                                        planets/angles can be excellent if you want those exact results (e.g., Saturn-MC for mastery).
                                    </p>
                                </div>
                            </div>

                            <p className="text-xs text-text/60">
                                Heads-up: This is a symbolic tool; not a substitute for legal/medical/financial advice or on-the-ground research.
                                Always consider safety, visas, costs, language, and community.
                            </p>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    )
}
