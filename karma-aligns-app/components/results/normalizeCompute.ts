// components/results/normalizeCompute.ts
type KV = Record<string, any>;
const isObj = (v: any) => v && typeof v === "object" && !Array.isArray(v);

/** Coerce value into an array.
 * - arrays -> same
 * - objects -> Object.values(obj)
 * - null/undefined -> []
 * - anything else -> [v]
 */
function toArr<T = any>(v: any): T[] {
  if (Array.isArray(v)) return v as T[];
  if (v == null) return [];
  if (isObj(v)) return Object.values(v) as T[];
  return [v as T];
}

export type Norm = {
  identity?: { sun?: string; moon?: string; rising?: string; nakshatra?: string; ayanamsha?: string };
  positions?: Array<{ body: string; sign: string; degree: number; house?: number; retro?: boolean }>;
  houses?: Array<{ house: number; sign?: string; lord?: string; degree?: number }>;
  strengths?: Array<{ body: string; score: number }>;
  shadbala?: Array<{ pillar: string; value: number }>;
  bhavaBala?: Array<{ house: number; score: number }>;
  ashtakavarga?: { headers?: string[]; rows?: Array<{ name: string; cells: number[] }> };
  aspects?: Array<{ from: string; to: string; type: string }>;
  dashas?: Array<{ system: string; items: Array<{ name: string; from: string; to: string; strength?: number }> }>;
  transits?: Array<{ date: string; hits: Array<{ body: string; target: string; type: string }> }>;
  yogas?: Array<{ title: string; summary: string; tag?: string }>;
  remedies?: Array<{ title: string; summary: string }>;
  doshas?: Array<{ title: string; level: "low"|"med"|"high"; note?: string }>;
  recommendations?: Array<{ title: string; bullets: string[] }>;
  notes?: Array<{ title: string; bullets: string[] }>;
  divisional?: Array<{ name: string; image?: string }>;
  calendar?: Array<{ date: string; tithi?: string; nakshatra?: string; yoga?: string; karana?: string }>;
  acg?: {
    advice?: Record<string, string[]>;
    lines?: Record<string, { ASC?: Array<{ lat:number; lon:number }>; DSC?: Array<{ lat:number; lon:number }> }>;
  };
  raw?: any;
};

/** Map your raw compute response into a stable shape the UI understands. */
export function normalizeCompute(raw: any): Norm {
  if (!raw) return { raw: raw ?? null };

  const basics = raw.basics ?? raw.core ?? {};
  const positions = toArr(raw.positions ?? raw.planets ?? raw.placements).map((p: any) => ({
    body: p?.body ?? p?.name ?? "",
    sign: p?.sign ?? "",
    degree: Number(p?.degree ?? p?.deg ?? 0),
    house: p?.house ?? p?.h ?? undefined,
    retro: !!(p?.retro ?? p?.isRetro ?? false),
  }));

  const houses = toArr(raw.houses ?? raw.bhava).map((h: any) => ({
    house: Number(h?.house ?? h?.no ?? h?.index ?? 0),
    sign: h?.sign,
    lord: h?.lord,
    degree: h?.degree ?? h?.deg,
  }));

  const strengths = toArr(raw.strengths ?? raw.planet_strengths).map((s: any) => ({
    body: s?.body ?? s?.name ?? "",
    score: Number(s?.score ?? s?.value ?? 0),
  }));

  // shadbala can be an array OR an object { pillarName: value }
  const shadbalaRaw = raw.shadbala ?? raw.shad_bala;
  let shadbala: Array<{ pillar: string; value: number }> | undefined;
  if (Array.isArray(shadbalaRaw)) {
    shadbala = shadbalaRaw.map((x: any) => ({
      pillar: x?.pillar ?? x?.name ?? "",
      value: Number(x?.value ?? 0),
    }));
  } else if (isObj(shadbalaRaw)) {
    shadbala = Object.entries(shadbalaRaw).map(([pillar, value]) => ({
      pillar,
      value: Number(value as any),
    }));
  } else {
    shadbala = undefined;
  }

  const bhavaBala = toArr(raw.bhavaBala ?? raw.bhava_bala).map((x: any) => ({
    house: Number(x?.house ?? x?.no ?? 0),
    score: Number(x?.score ?? x?.value ?? 0),
  }));

  // ashtakavarga: support { headers, rows } OR object rows
  let ashtakavarga: Norm["ashtakavarga"] | undefined = undefined;
  const ashta = raw.ashtakavarga ?? raw.ashta;
  if (ashta) {
    const headers = toArr(ashta.headers);
    const rowsArr = toArr(ashta.rows).map((r: any) => ({
      name: r?.name ?? r?.row ?? "",
      cells: toArr<number>(r?.cells).map((c: any) => Number(c ?? 0)),
    }));
    ashtakavarga = {
      headers: headers.length ? (headers as string[]) : undefined,
      rows: rowsArr.length ? rowsArr : undefined,
    };
  }

  const aspects = toArr(raw.aspects).map((a: any) => ({
    from: a?.from ?? "",
    to: a?.to ?? "",
    type: a?.type ?? a?.aspect ?? "",
  }));

  const dashas = toArr(raw.dashas ?? raw.dasha).map((d: any) => ({
    system: d?.system ?? d?.name ?? "Dasha",
    items: toArr(d?.items ?? d?.periods).map((i: any) => ({
      name: i?.name ?? "",
      from: i?.from ?? "",
      to: i?.to ?? "",
      strength: i?.strength ?? i?.score,
    })),
  }));

  const transits = toArr(raw.transits).map((t: any) => ({
    date: t?.date ?? "",
    hits: toArr(t?.hits).map((h: any) => ({
      body: h?.body ?? "",
      target: h?.target ?? "",
      type: h?.type ?? "",
    })),
  }));

  const yogas = toArr(raw.yogas).map((y: any) => ({
    title: y?.title ?? y?.name ?? "",
    summary: y?.summary ?? y?.desc ?? "",
    tag: y?.tag,
  }));

  const remedies = toArr(raw.remedies ?? raw.upaya).map((r: any) => ({
    title: r?.title ?? r?.name ?? "",
    summary: r?.summary ?? r?.desc ?? "",
  }));

  const doshas = toArr(raw.doshas).map((d: any) => ({
    title: d?.title ?? d?.name ?? "",
    level: (d?.level ?? "med") as "low" | "med" | "high",
    note: d?.note,
  }));

  const recommendations = toArr(raw.recommendations ?? raw.tips).map((t: any) => ({
    title: t?.title ?? "",
    bullets: toArr(t?.bullets).map((b) => String(b)),
  }));

  const notes = toArr(raw.notes ?? raw.insights).map((n: any) => ({
    title: n?.title ?? "",
    bullets: toArr(n?.bullets).map((b) => String(b)),
  }));

  const divisional = toArr(raw.divisional ?? raw.varga).map((v: any) => ({
    name: v?.name ?? "",
    image: v?.image,
  }));

  const calendar = toArr(raw.calendar ?? raw.panchanga).map((c: any) => ({
    date: c?.date ?? "",
    tithi: c?.tithi,
    nakshatra: c?.nakshatra,
    yoga: c?.yoga,
    karana: c?.karana,
  }));

  // ACG: ensure lines subkeys are arrays
  let acg: Norm["acg"] | undefined = undefined;
  if (raw.acg) {
    const linesObj = raw.acg.lines ?? {};
    const safeLines: any = {};
    Object.keys(linesObj || {}).forEach((planet) => {
      const L = linesObj[planet] || {};
      safeLines[planet] = {
        ASC: toArr(L.ASC),
        DSC: toArr(L.DSC),
      };
    });
    acg = {
      advice: isObj(raw.acg.advice) ? (raw.acg.advice as Record<string, string[]>) : undefined,
      lines: Object.keys(safeLines).length ? safeLines : undefined,
    };
  }

  return {
    identity: {
      sun: basics?.sun ?? positions.find((p) => p.body === "Sun")?.sign,
      moon: basics?.moon ?? positions.find((p) => p.body === "Moon")?.sign,
      rising: basics?.rising ?? basics?.asc ?? positions.find((p) => p.body === "Ascendant")?.sign,
      nakshatra: basics?.nakshatra,
      ayanamsha: basics?.ayanamsha,
    },
    positions,
    houses,
    strengths: strengths.length ? strengths : undefined,
    shadbala: shadbala && shadbala.length ? shadbala : undefined,
    bhavaBala: bhavaBala.length ? bhavaBala : undefined,
    ashtakavarga,
    aspects: aspects.length ? aspects : undefined,
    dashas: dashas.length ? dashas : undefined,
    transits: transits.length ? transits : undefined,
    yogas: yogas.length ? yogas : undefined,
    remedies: remedies.length ? remedies : undefined,
    doshas: doshas.length ? doshas : undefined,
    recommendations: recommendations.length ? recommendations : undefined,
    notes: notes.length ? notes : undefined,
    divisional: divisional.length ? divisional : undefined,
    calendar: calendar.length ? calendar : undefined,
    acg,
    raw,
  };
}
