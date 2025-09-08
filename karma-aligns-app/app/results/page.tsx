"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Starfield from "@/components/landing/Starfield";
import SiteHeader from "@/components/landing/SiteHeader";
import ResultsCards, { Placement } from "@/components/results/ResultsCards";
import ResultsTable from "@/components/results/ResultsTable";
import AscSummary from "@/components/results/AscSummary";
import RashiChalit from "@/components/results/RashiChalit";
import HousesTable from "@/components/results/HousesTable";
import AspectsList, { AspectEdge } from "@/components/results/AspectsList";
import { Merriweather, Merriweather_Sans } from "next/font/google";

const merriweather = Merriweather({ subsets: ["latin"], weight: ["700"], display: "swap" });
const merriweatherSans = Merriweather_Sans({ subsets: ["latin"], weight: ["400", "700"], display: "swap" });

type AnyRow = Record<string, any>;
type ApiResponsePlanets = { chart_id?: string; table?: AnyRow[]; planets?: Record<string, any> };
type ApiAsc = { asc?: { idx?: number; lon?: number }; chart_id?: string };
type ApiHouses = { asc_sidereal?: number; cusps?: number[]; chart_id?: string };
type ApiRashi = { asc_idx?: number; rashi?: string[][]; chart_id?: string };
type ApiChalit = { chalit?: string[][]; chart_id?: string };
type ApiAspects = { aspects?: { aspects?: AspectEdge[] }; chart_id?: string };

const SYMBOL_BY_PLANET: Record<string, string> = {
  Sun: "☉", Moon: "☽", Mercury: "☿", Venus: "♀", Mars: "♂", Jupiter: "♃",
  Saturn: "♄", Uranus: "⛢", Neptune: "♆", Pluto: "♇", Rahu: "☊", Ketu: "☋",
};

// ---------- helpers ----------
function pick<T = any>(obj: AnyRow, keys: string[], fallback: T): T {
  for (const k of keys) {
    if (obj && obj[k] !== undefined && obj[k] !== null) return obj[k] as T;
  }
  return fallback;
}
function asStr(v: any) {
  return (v === undefined || v === null) ? "" : String(v).trim();
}
function asInt(v: any) {
  const n = typeof v === "number" ? v : parseInt(String(v).replace(/[^\d-]/g, ""), 10);
  return Number.isFinite(n) ? n : 0;
}
function asFloat(v: any) {
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}
function toBool(v: any): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  const s = String(v).trim().toLowerCase();
  return ["true","t","yes","y","r"].includes(s);
}
function parseDegreeTextToNum(v: any): { text: string; num: number } {
  const text = asStr(v);
  const m = text.match(/([\d.]+)/);
  return { text, num: m ? parseFloat(m[1]) : 0 };
}

export default function ResultsPage() {
  const sp = useSearchParams();
  const router = useRouter();

  const params = useMemo(() => {
    const dob = sp.get("dob") || "";
    const tob = sp.get("tob") || "";
    const tz = sp.get("tz") || "";
    const lat = sp.get("lat") || "";
    const lon = sp.get("lon") || "";
    const varsha_year = sp.get("varsha_year") || String(new Date().getFullYear() + 1);
    return { dob, tob, tz, lat, lon, varsha_year };
  }, [sp]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // main placements
  const [chartId, setChartId] = useState<string | null>(null);
  const [rows, setRows] = useState<Placement[]>([]);

  // new datasets
  const [ascIdx, setAscIdx] = useState<number | null>(null);
  const [ascLon, setAscLon] = useState<number | null>(null);

  const [cusps, setCusps] = useState<number[] | null>(null);
  const [ascSidereal, setAscSidereal] = useState<number | null>(null);

  const [rashi, setRashi] = useState<string[][] | null>(null);
  const [chalit, setChalit] = useState<string[][] | null>(null);

  const [aspects, setAspects] = useState<AspectEdge[] | null>(null);

  useEffect(() => {
    async function run() {
      try {
        setLoading(true);
        setError(null);

        if (!params.dob || !params.tob || !params.tz || !params.lat || !params.lon) {
          setError("Missing query parameters. Please submit the form again.");
          setLoading(false);
          return;
        }

        const qs = new URLSearchParams(params as Record<string, string>).toString();
        const base = "http://localhost:5000/api/v1";
        const urls = {
          planets: `${base}/planets?${qs}`,
          asc: `${base}/asc?${qs}`,
          houses: `${base}/houses?${qs}`,
          rashi: `${base}/charts/rashi?${qs}`,
          chalit: `${base}/charts/chalit?${qs}`,
          aspects: `${base}/aspects?${qs}`,
        };

        const [pRes, aRes, hRes, rRes, cRes, sRes] = await Promise.all([
          fetch(urls.planets), fetch(urls.asc), fetch(urls.houses),
          fetch(urls.rashi), fetch(urls.chalit), fetch(urls.aspects),
        ]);

        if (!pRes.ok) throw new Error(`Planets error: ${pRes.status}`);

        const [pJson, aJson, hJson, rJson, cJson, sJson] = await Promise.all([
          pRes.json() as Promise<ApiResponsePlanets>,
          aRes.ok ? aRes.json() as Promise<ApiAsc> : Promise.resolve({}),
          hRes.ok ? hRes.json() as Promise<ApiHouses> : Promise.resolve({}),
          rRes.ok ? rRes.json() as Promise<ApiRashi> : Promise.resolve({}),
          cRes.ok ? cRes.json() as Promise<ApiChalit> : Promise.resolve({}),
          sRes.ok ? sRes.json() as Promise<ApiAspects> : Promise.resolve({}),
        ]);

        // ---- placements (new table shape, fallback to legacy planets) ----
        let placements: Placement[] = [];
        if (Array.isArray(pJson.table) && pJson.table.length > 0) {
          placements = pJson.table.map((r: AnyRow) => {
            const planet = asStr(pick<string>(r, ["Planets", "Planet", "Body"], ""));
            const { text: degree, num: degreeNum } = parseDegreeTextToNum(pick(r, ["Degree", "Degrees", "Longitude"], ""));
            const sign = asStr(pick<string>(r, ["Sign", "Rasi", "Zodiac"], ""));
            const house = asInt(pick(r, ["House"], 0));
            const nakshatra = asStr(pick<string>(r, ["Nakshatra"], ""));
            const nakshatraLord = asStr(pick<string>(r, ["Nakshatra Lord", "NakshatraLord"], ""));
            const nakshatraPada = asInt(pick(r, ["Nakshatra Pada", "NakshatraPada"], 0));
            const signLord = asStr(pick<string>(r, ["Sign Lord", "SignLord"], ""));
            const retrograde = toBool(pick(r, ["Retrograde", "R", "Retro"], false));
            const symbol = asStr(pick<string>(r, ["Symbols", "Symbol"], SYMBOL_BY_PLANET[planet] || ""));
            return { planet, degree, degreeNum, house, nakshatra, nakshatraLord, nakshatraPada, sign, signLord, retrograde, symbol };
          });
        } else if (pJson.planets && typeof pJson.planets === "object") {
          // fallback (legacy)
          placements = Object.entries(pJson.planets).map(([planet, v]: any) => {
            const lon = asFloat(v?.lon ?? 0);
            const deg = `${(lon % 30).toFixed(2)}°`;
            return {
              planet,
              degree: deg,
              degreeNum: asFloat(deg),
              house: 0,
              nakshatra: "",
              nakshatraLord: "",
              nakshatraPada: 0,
              sign: "",
              signLord: "",
              retrograde: toBool(v?.retrograde),
              symbol: SYMBOL_BY_PLANET[planet] || "",
            } as Placement;
          });
        }
        setRows(placements);
        setChartId(pJson.chart_id ?? null);

        // ---- asc ----
        if ((aJson as any)?.asc) {
          const a = (aJson as any).asc;
          if (typeof a.idx === "number") setAscIdx(a.idx);
          if (typeof a.lon === "number") setAscLon(a.lon);
        }

        // ---- houses ----
        if (Array.isArray((hJson as any)?.cusps)) setCusps((hJson as any).cusps);
        if (typeof (hJson as any)?.asc_sidereal === "number") setAscSidereal((hJson as any).asc_sidereal);

        // ---- rashi & chalit ----
        if (Array.isArray((rJson as any)?.rashi)) setRashi((rJson as any).rashi);
        if (typeof (rJson as any)?.asc_idx === "number" && ascIdx == null) setAscIdx((rJson as any).asc_idx);
        if (Array.isArray((cJson as any)?.chalit)) setChalit((cJson as any).chalit);

        // ---- aspects ----
        const edges = (sJson as any)?.aspects?.aspects ?? [];
        setAspects(edges);

      } catch (e: any) {
        setError(e?.message ?? "Failed to fetch.");
      } finally {
        setLoading(false);
      }
    }
    run();
  }, [params]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[radial-gradient(100%_120%_at_50%_0%,#0b1020_0%,#0a0720_40%,#0a0720_60%,#080616_100%)] text-white">
      <Starfield />
      <SiteHeader />

      <main className="relative z-20 mx-auto max-w-7xl px-6 pt-28 pb-16">
        <div className="mb-6 flex items-center justify-between">
          <h1 className={`${merriweather.className} text-3xl text-sky-200`}>Chart results</h1>
          <button
            onClick={() => router.push("/")}
            className={`${merriweatherSans.className} rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm hover:bg-white/10 transition`}
          >
            New chart
          </button>
        </div>

        {loading && (
          <div className="mt-10 flex items-center gap-3 text-slate-300">
            <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-slate-300/60 border-t-transparent" />
            Fetching data…
          </div>
        )}

        {error && <p className="mt-10 text-rose-300/90">{error}</p>}

        {!loading && !error && (
          <>
            <AscSummary ascIdx={ascIdx} ascLon={ascLon ?? ascSidereal ?? null} cusps={cusps ?? []} />
            <div className="mt-8">
              <ResultsCards rows={rows} chartId={chartId} params={params} />
            </div>
            <div className="mt-10">
              <RashiChalit rashi={rashi} chalit={chalit} ascIdx={ascIdx} />
            </div>
            <div className="mt-10">
              <HousesTable cusps={cusps} />
            </div>
            <div className="mt-10">
              <AspectsList aspects={aspects ?? []} />
            </div>
            <div className="mt-10">
              <h2 className={`${merriweather.className} mb-3 text-2xl text-sky-200`}>Full placements</h2>
              <ResultsTable rows={rows} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
