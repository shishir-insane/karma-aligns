"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Starfield from "@/components/landing/Starfield";
import SiteHeader from "@/components/landing/SiteHeader";
import ResultsTable from "@/components/results/ResultsTable";
import AscSummary from "@/components/results/AscSummary";
import RashiChalit from "@/components/results/RashiChalit";
import AspectsList, { AspectEdge } from "@/components/results/AspectsList";
import ACGLinesMap, { ACGLines } from "@/components/results/ACGLinesMap";
import Panchanga from "@/components/results/Panchanga";
import ShadbalaBars, { ShadbalaItem } from "@/components/results/ShadbalaBars";
import BhavaBalaBars, { BhavaItem } from "@/components/results/BhavaBalaBars";
import AshtakavargaHeat, { AshtakaData } from "@/components/results/AshtakavargaHeat";
import DashaTimeline, { DashaSystems } from "@/components/results/DashaTimeline";
import VargasGrids, { VargasData } from "@/components/results/VargasGrids";
import InsightsYogas, { InsightsPayload } from "@/components/results/InsightsYogas";
import { loadCompute, type ComputeParams } from "@/lib/computeCache";
import { Merriweather } from "next/font/google";
const merriweather = Merriweather({ subsets: ["latin"], weight: ["700"], display: "swap" });

type AnyRec = Record<string, any>;
type Placement = {
  planet: string; degree: string; degreeNum: number;
  house: number; nakshatra: string; nakshatraLord: string; nakshatraPada: number;
  sign: string; signLord: string; retrograde: boolean; symbol: string;
};

const SYMBOL_BY_PLANET: Record<string, string> = {
  Sun: "☉", Moon: "☽", Mercury: "☿", Venus: "♀", Mars: "♂", Jupiter: "♃",
  Saturn: "♄", Uranus: "⛢", Neptune: "♆", Pluto: "♇", Rahu: "☊", Ketu: "☋",
};

// helpers
function asStr(v: any) { return v == null ? "" : String(v).trim(); }
function asInt(v: any) { const n = typeof v === "number" ? v : parseInt(String(v).replace(/[^\d-]/g, ""), 10); return Number.isFinite(n) ? n : 0; }
function asFloat(v: any) { const n = typeof v === "number" ? v : parseFloat(String(v).replace(/[^\d.-]/g, "")); return Number.isFinite(n) ? n : 0; }
function toBool(v: any): boolean { if (typeof v === "boolean") return v; if (typeof v === "number") return v !== 0; const s = String(v ?? "").toLowerCase(); return ["true","t","yes","y","r"].includes(s); }
function pick<T = any>(obj: AnyRec | undefined, keys: string[], fallback: T): T { for (const k of keys) if (obj && obj[k] !== undefined && obj[k] !== null) return obj[k] as T; return fallback; }
function parseDegreeTextToNum(v: any): { text: string; num: number } { const text = asStr(v); const m = text.match(/([\d.]+)/); return { text, num: m ? parseFloat(m[1]) : 0 }; }

export default function ResultsPage() {
  const sp = useSearchParams();

  // Build stable params + key
  const params = useMemo<ComputeParams>(() => ({
    dob: sp.get("dob") || "",
    tob: sp.get("tob") || "",
    tz: decodeURIComponent(sp.get("tz") || ""),
    lat: sp.get("lat") || "",
    lon: sp.get("lon") || "",
  }), [sp]);

  const key = useMemo(() => `${params.dob}|${params.tob}|${params.tz}|${params.lat}|${params.lon}`, [params]);

  // --- state ---
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [chartId, setChartId] = useState<string | null>(null);

  const [ascIdx, setAscIdx] = useState<number | null>(null);
  const [ascLon, setAscLon] = useState<number | null>(null);

  const [rows, setRows] = useState<Placement[]>([]);
  const [rashi, setRashi] = useState<string[][] | null>(null);
  const [chalit, setChalit] = useState<string[][] | null>(null);
  const [vargas, setVargas] = useState<VargasData | null>(null);

  const [shadbala, setShadbala] = useState<ShadbalaItem[] | null>(null);
  const [bhavaBala, setBhavaBala] = useState<BhavaItem[] | null>(null);
  const [ashtaka, setAshtaka] = useState<AshtakaData | null>(null);

  const [dashas, setDashas] = useState<DashaSystems | null>(null);
  const [aspects, setAspects] = useState<AspectEdge[] | null>(null);

  const [acgLines, setAcgLines] = useState<ACGLines | null>(null);
  const [acgAdvice, setAcgAdvice] = useState<Record<string, string[]> | null>(null);

  const [insights, setInsights] = useState<InsightsPayload | null>(null);
  const [panchanga, setPanchanga] = useState<any | null>(null);

  // --- one function to apply a /compute JSON into state ---
  function applyCompute(json: AnyRec) {
    setChartId(asStr(json.chart_id));
    const asc = json.asc || json.overview?.asc || {};
    if (typeof asc.idx === "number") setAscIdx(asc.idx);
    if (typeof asc.lon === "number") setAscLon(asc.lon);

    // table -> rows
    const table: AnyRec[] = json.table || json.planets_table || [];
    if (Array.isArray(table) && table.length) {
      setRows(table.map((r) => {
        const planet = asStr(pick(r, ["Planets","Planet","Body"], ""));
        const { text: degree, num: degreeNum } = parseDegreeTextToNum(pick(r, ["Degree","Degrees","Longitude"], ""));
        return {
          planet, degree, degreeNum,
          house: asInt(pick(r, ["House"], 0)),
          nakshatra: asStr(pick(r, ["Nakshatra"], "")),
          nakshatraLord: asStr(pick(r, ["Nakshatra Lord","NakshatraLord"], "")),
          nakshatraPada: asInt(pick(r, ["Nakshatra Pada","NakshatraPada"], 0)),
          sign: asStr(pick(r, ["Sign","Rasi","Zodiac"], "")),
          signLord: asStr(pick(r, ["Sign Lord","SignLord"], "")),
          retrograde: toBool(pick(r, ["Retrograde","R","Retro"], false)),
          symbol: asStr(pick(r, ["Symbols","Symbol"], SYMBOL_BY_PLANET[planet] || "")),
        };
      }));
    } else if (json.planets) {
      setRows(Object.entries(json.planets).map(([planet, v]: any) => {
        const lonDeg = asFloat(v?.lon ?? 0);
        const deg = `${(lonDeg % 30).toFixed(2)}°`;
        return {
          planet, degree: deg, degreeNum: parseFloat((deg.match(/[\d.]+/) || [0])[0] as any),
          house: 0, nakshatra: "", nakshatraLord: "", nakshatraPada: 0,
          sign: "", signLord: "", retrograde: toBool(v?.retrograde),
          symbol: SYMBOL_BY_PLANET[planet] || "",
        };
      }));
    }

    const charts = json.charts || {};
    if (Array.isArray(charts.rashi))  setRashi(charts.rashi);
    if (Array.isArray(charts.chalit)) setChalit(charts.chalit);
    setVargas(charts.vargas || null);

    if (json.shadbala) {
      const totals = json.shadbala.total || json.shadbala.totals || {};
      const comps  = json.shadbala.components || {};
      const items: ShadbalaItem[] = Object.keys(totals).map((planet) => ({
        planet, total: asFloat(totals[planet]), components: comps[planet] || {},
      })).sort((a,b) => b.total - a.total);
      setShadbala(items);
    }

    if (json.bhava_bala) {
      let arr: any = null;
      if (Array.isArray(json.bhava_bala.bhava_bala)) arr = json.bhava_bala.bhava_bala;
      else if (Array.isArray(json.bhava_bala.houses)) arr = json.bhava_bala.houses;
      else if (Array.isArray(json.bhava_bala)) arr = json.bhava_bala;
      else if (typeof json.bhava_bala === "object") {
        const vals = Object.values(json.bhava_bala);
        if (vals.length === 1 && Array.isArray(vals[0])) arr = vals[0];
      }
      if (Array.isArray(arr)) {
        setBhavaBala(arr.map((h: any, i: number) => ({
          house: asInt(pick(h, ["house"], i + 1)),
          benefic: asFloat(pick(h, ["benefic","benefics","good"], 0)),
          malefic: asFloat(pick(h, ["malefic","malefics","bad"], 0)),
          net: asFloat(pick(h, ["net"], 0)),
        })));
      } else {
        setBhavaBala(null);
      }
    }

    if (json.ashtakavarga) {
      const sav = json.ashtakavarga.SAV || json.ashtakavarga.sav || null;
      const pav = json.ashtakavarga.PAV || json.ashtakavarga.pav || null;
      setAshtaka(sav || pav ? { sav, pav } : null);
    }

    if (json.dasha) setDashas(json.dasha);

    const edges = json.aspects?.aspects || json.aspects || [];
    setAspects(Array.isArray(edges) ? edges : []);

    if (json.acg) {
      if (json.acg.lines) setAcgLines(json.acg.lines);
      if (json.acg.advice) setAcgAdvice(json.acg.advice);
    }

    if (json.kundli_predictions) {
      setInsights({
        predictions: json.kundli_predictions,
        yogas: json.yogas || [],
        categories: {
          Wealth: json.kundli_predictions.Wealth || [],
          Relationships: json.kundli_predictions.Relationships || [],
          Learning: json.kundli_predictions["Learning/Spiritual"] || [],
          Health: json.kundli_predictions.Health || [],
        },
      });
    }

    if (json.panchanga) setPanchanga(json.panchanga);
  }

  // --- hydrate from cache first; fetch only if missing ---
  useEffect(() => {
    (async () => {
      try {
        setLoading(true); setError(null);

        if (!params.dob || !params.tob || !params.tz || !params.lat || !params.lon) {
          setError("Missing query parameters. Please submit the form again.");
          setLoading(false);
          return;
        }

        // 1) Try cache
        const cached = loadCompute(params);
        if (cached) {
          applyCompute(cached);
          setLoading(false);
          return;
        }

        // 2) Fallback to network (first load via deep-link/refresh)
        const res = await fetch("http://localhost:5000/api/v1/compute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dob: params.dob, tob: params.tob, tz: params.tz,
            lat: parseFloat(params.lat), lon: parseFloat(params.lon),
          }),
        });
        if (!res.ok) throw new Error(`Compute error: ${res.status}`);
        const json = await res.json();
        applyCompute(json);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load chart.");
      } finally {
        setLoading(false);
      }
    })();
    // depend only on the stable key (hash changes won't retrigger)
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  const headerSections = [
    { id: "overview",    label: "Overview" },
    { id: "panchanga",   label: "Pañcāṅga" },
    { id: "strengths",   label: "Strengths" },
    { id: "timelines",   label: "Dashā" },
    { id: "charts",      label: "Charts" },
    { id: "aspects",     label: "Aspects" },
    { id: "relocation",  label: "Relocation" },
    { id: "insights",    label: "Insights" },
    { id: "placements",  label: "Placements" },
  ];

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[radial-gradient(100%_120%_at_50%_0%,#0b1020_0%,#0a0720_40%,#0a0720_60%,#080616_100%)] text-white">
      <Starfield />
      <SiteHeader sections={headerSections} />

      <main className="relative z-20 mx-auto max-w-7xl px-6 pt-28 pb-16">
        <h1 className={`${merriweather.className} text-3xl text-sky-200`}>Chart results</h1>

        {loading && (
          <div className="mt-10 flex items-center gap-3 text-slate-300">
            <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-slate-300/60 border-t-transparent" />
            Preparing your chart…
          </div>
        )}

        {error && <p className="mt-10 text-rose-300/90">{error}</p>}

        {!loading && !error && (
          <>
            <section id="overview" className="scroll-mt-24">
              <AscSummary ascIdx={ascIdx} ascLon={ascLon} cusps={[]} />
            </section>

            {panchanga && (
              <section id="panchanga" className="mt-6 scroll-mt-24">
                <Panchanga data={panchanga} />
              </section>
            )}

            <section id="strengths" className="mt-10 grid grid-cols-1 gap-6 scroll-mt-24">
              {shadbala && <><h2 className="mb-3 text-2xl text-sky-200">Śaḍbala</h2><ShadbalaBars items={shadbala} /></>}
              {bhavaBala && <><h2 className="mb-3 mt-6 text-2xl text-sky-200">Bhāva Bala</h2><BhavaBalaBars items={bhavaBala} /></>}
              {ashtaka && <><h2 className="mb-3 mt-6 text-2xl text-sky-200">Aṣṭakavarga</h2><AshtakavargaHeat data={ashtaka} /></>}
            </section>

            {dashas && (
              <section id="timelines" className="mt-10 scroll-mt-24">
                <h2 className="mb-3 text-2xl text-sky-200">Dashā timelines</h2>
                <DashaTimeline systems={dashas} />
              </section>
            )}

            <section id="charts" className="mt-10 grid grid-cols-1 gap-8 scroll-mt-24">
              {(rashi || chalit) && <RashiChalit rashi={rashi} chalit={chalit} ascIdx={ascIdx} />}
              {vargas && (<div><h2 className="mb-3 text-2xl text-sky-200">Vargas</h2><VargasGrids vargas={vargas} /></div>)}
            </section>

            {aspects && (
              <section id="aspects" className="mt-10 scroll-mt-24">
                <AspectsList aspects={aspects} />
              </section>
            )}

            {acgLines && (
              <section id="relocation" className="mt-12 scroll-mt-24">
                <h2 className="mb-4 text-2xl text-sky-200">Relocation & lines</h2>
                <ACGLinesMap lines={acgLines} advice={acgAdvice || undefined} />
              </section>
            )}

            {insights && (
              <section id="insights" className="mt-12 scroll-mt-24">
                <h2 className="mb-4 text-2xl text-sky-200">Insights & Yogas</h2>
                <InsightsYogas data={insights} />
              </section>
            )}

            {rows.length > 0 && (
              <section id="placements" className="mt-12 scroll-mt-24">
                <h2 className="mb-3 text-2xl text-sky-200">Full placements</h2>
                <ResultsTable rows={rows} />
              </section>
            )}

            {chartId && <p className="mt-8 text-xs text-slate-500">Chart ID: {chartId.slice(0,16)}…</p>}
          </>
        )}
      </main>
    </div>
  );
}
