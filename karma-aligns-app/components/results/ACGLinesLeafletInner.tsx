"use client";

import React, { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Polyline, Tooltip, Pane } from "react-leaflet";

type LatLon = { lat: number; lon: number };
export type PlanetAngles = { ASC?: LatLon[]; DSC?: LatLon[]; MC?: { lon: number } | LatLon[]; IC?: { lon: number } | LatLon[]; };
export type ACGLines = Record<string, PlanetAngles>;

function clampLon(lon: number) { let L = lon; while (L < -180) L += 360; while (L > 180) L -= 360; return L; }
function buildMeridian(lon: number, step = 2): LatLon[] {
  const L = clampLon(lon); const pts: LatLon[] = []; for (let lat=-85; lat<=85; lat+=step) pts.push({ lat, lon: L }); return pts;
}
function asPolyline(a?: LatLon[] | { lon: number }): LatLon[] | undefined {
  if (!a) return undefined; if (Array.isArray(a)) return a; if (typeof a.lon === "number") return buildMeridian(a.lon); return undefined;
}

const PLANET_COLORS: Record<string, string> = {
  Sun: "#f59e0b", Moon: "#93c5fd", Mercury: "#22c55e", Venus: "#f472b6", Mars: "#ef4444",
  Jupiter: "#fbbf24", Saturn: "#eab308", Uranus: "#2dd4bf", Neptune: "#60a5fa", Pluto: "#a78bfa",
  Rahu: "#94a3b8", Ketu: "#cbd5e1",
};
const PLANET_ORDER = ["Sun","Moon","Mercury","Venus","Mars","Jupiter","Saturn","Uranus","Neptune","Pluto","Rahu","Ketu"] as const;
const ANGLES = ["ASC","DSC","MC","IC"] as const;
const ANGLE_STYLE: Record<string, { dashArray?: string; weight: number }> = {
  ASC: { weight: 2.5 }, DSC: { dashArray: "6 6", weight: 2.5 }, MC: { weight: 3 }, IC: { dashArray: "2 6", weight: 2.5 },
};

// Inject Leaflet CSS
function LeafletCSS() {
  useEffect(() => {
    const id = "leaflet-css"; if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id; link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    link.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
    link.crossOrigin = ""; document.head.appendChild(link);
  }, []);
  return null;
}

export default function ACGLinesLeafletInner({
  lines,
  advice,
}: {
  lines: ACGLines;
  advice?: Record<string, string[]>;
}) {
  // planets list
  const planets = useMemo(() => {
    const keys = Object.keys(lines || {});
    const ordered = [...keys].sort((a, b) => {
      const ia = PLANET_ORDER.indexOf(a as any), ib = PLANET_ORDER.indexOf(b as any);
      if (ia === -1 && ib === -1) return a.localeCompare(b);
      if (ia === -1) return 1; if (ib === -1) return -1; return ia - ib;
    });
    return ordered;
  }, [lines]);

  // UI state
  const [mode, setMode] = useState<"selected" | "all">("selected");
  const [planet, setPlanet] = useState<string>(planets[0] || "");
  const [angle, setAngle] = useState<typeof ANGLES[number]>("ASC");
  const [angleFilter, setAngleFilter] = useState<Record<typeof ANGLES[number], boolean>>({ ASC: true, DSC: true, MC: true, IC: true });
  const [showAdvice, setShowAdvice] = useState(false);

  useEffect(() => {
    if (!planets.includes(planet) && planets.length) setPlanet(planets[0]);
  }, [planets, planet]);

  // Build polylines
  type DrawLine = { id: string; planet: string; angle: string; color: string; coords: [number, number][] };
  const drawLines = useMemo<DrawLine[]>(() => {
    if (!lines) return [];
    const items: DrawLine[] = [];
    const visibleAngles = (a: string) => (mode === "all" ? angleFilter[a as keyof typeof angleFilter] : a === angle);
    const whichPlanets = mode === "all" ? planets : planets.filter((p) => p === planet);

    for (const p of whichPlanets) {
      const pa = lines[p] || {};
      for (const a of ANGLES) {
        if (!visibleAngles(a)) continue;
        const poly = asPolyline((pa as any)[a]);
        if (!poly || poly.length < 2) continue;
        const color = PLANET_COLORS[p] || "#7dd3fc";
        const coords = poly.map(({ lat, lon }) => [lat, clampLon(lon)] as [number, number]);
        items.push({ id: `${p}-${a}`, planet: p, angle: a, color, coords });
      }
    }
    return items;
  }, [lines, planets, planet, angle, mode, angleFilter]);

  return (
    <div className="relative rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur p-4">
      <LeafletCSS />

      {/* Controls */}
      <div className="mb-3 flex flex-wrap items-center gap-3 text-xs">
        <div className="inline-flex overflow-hidden rounded-full border border-white/10">
          <button onClick={() => setMode("selected")} className={`px-3 py-1 ${mode==="selected" ? "bg-white/10" : "bg-white/5 hover:bg-white/10"}`}>Selected</button>
          <button onClick={() => setMode("all")} className={`px-3 py-1 ${mode==="all" ? "bg-white/10" : "bg-white/5 hover:bg-white/10"}`}>Show all lines</button>
        </div>

        {mode === "selected" && (
          <>
            <label className="ml-1">
              Planet{" "}
              <select className="ml-1 rounded-md bg-white/10 px-2 py-1 outline-none" value={planet} onChange={(e) => setPlanet(e.target.value)}>
                {planets.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </label>
            <label>
              Angle{" "}
              <select className="ml-1 rounded-md bg-white/10 px-2 py-1 outline-none" value={angle} onChange={(e) => setAngle(e.target.value as any)}>
                {ANGLES.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </label>
          </>
        )}

        {mode === "all" && (
          <div className="ml-auto flex items-center gap-2">
            {ANGLES.map((a) => (
              <label key={a} className="inline-flex items-center gap-1">
                <input type="checkbox" className="accent-sky-300" checked={angleFilter[a]} onChange={(e) => setAngleFilter((s) => ({ ...s, [a]: e.target.checked }))} />
                {a}
              </label>
            ))}
          </div>
        )}

        {advice && (
          <button
            className="ml-auto rounded-full border border-white/10 bg-white/10 px-3 py-1 hover:bg-white/20"
            onClick={() => setShowAdvice((s) => !s)}
          >
            {showAdvice ? "Hide advice" : "Show advice"}
          </button>
        )}
      </div>

      {/* Map */}
      <div className="relative w-full h-[520px] rounded-xl overflow-hidden">
        <MapContainer center={[20, 0]} zoom={2} minZoom={1} maxZoom={7} worldCopyJump className="w-full h-full" attributionControl>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          {/* Glow underlay */}
          <Pane name="glow" style={{ zIndex: 399 }}>
            {drawLines.map(({ id, color, coords }) => (
              <Polyline key={`glow-${id}`} positions={coords} pathOptions={{ color, weight: 8, opacity: 0.18, bubblingMouseEvents: false }} />
            ))}
          </Pane>

          {/* Main lines */}
          <Pane name="lines" style={{ zIndex: 400 }}>
            {drawLines.map(({ id, planet, angle, color, coords }) => (
              <Polyline
                key={`line-${id}`}
                positions={coords}
                pathOptions={{ color, weight: ANGLE_STYLE[angle].weight, dashArray: ANGLE_STYLE[angle].dashArray, opacity: 0.95 }}
                eventHandlers={{
                  mouseover: (e) => e.target.setStyle({ weight: ANGLE_STYLE[angle].weight + 2 }),
                  mouseout: (e) => e.target.setStyle({ weight: ANGLE_STYLE[angle].weight }),
                }}
              >
                <Tooltip sticky><div className="text-[11px]"><strong>{planet}</strong> • {angle}</div></Tooltip>
              </Polyline>
            ))}
          </Pane>
        </MapContainer>

        {/* Advice drawer */}
        {advice && (
          <div className={`absolute top-2 right-2 max-w-xs transition ${showAdvice ? "opacity-100 translate-x-0" : "pointer-events-none opacity-0 translate-x-2"}`}>
            <div className="rounded-xl border border-white/10 bg-black/70 backdrop-blur p-3 text-[12px] text-slate-200">
              <div className="mb-2 text-sky-200 font-semibold">Relocation advice</div>
              <div className="space-y-2">
                {Object.entries(advice).map(([bucket, lines]) => (
                  <div key={bucket}>
                    <div className="text-slate-300 mb-1">{bucket}</div>
                    <ul className="list-disc pl-4 space-y-1">
                      {lines.map((s, i) => <li key={i} className="text-slate-300/90">{s}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-slate-300">
        <span className="text-slate-400">Legend:</span>
        <span className="inline-flex items-center gap-1"><i className="inline-block h-[2px] w-6 bg-current" /> ASC (solid)</span>
        <span className="inline-flex items-center gap-1"><i className="inline-block h-[2px] w-6 border-t border-dashed border-current" /> DSC (dashed)</span>
        <span className="inline-flex items-center gap-1"><i className="inline-block h-[3px] w-6 bg-current" /> MC (thicker)</span>
        <span className="inline-flex items-center gap-1"><i className="inline-block h-[2px] w-6 border-t border-dotted border-current" /> IC (dot-dash)</span>
        <span className="ml-auto text-slate-500">Tiles © OpenStreetMap contributors</span>
      </div>
    </div>
  );
}
