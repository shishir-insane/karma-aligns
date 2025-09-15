// components/results/normalizeCompute.ts
type AnyObj = Record<string, any>;

const isObj = (x: any) => x && typeof x === "object" && !Array.isArray(x);
const toArr = <T = any>(x: any): T[] =>
  Array.isArray(x) ? x : x == null ? [] : isObj(x) ? (Object.values(x) as T[]) : [x as T];
const STR = (x: any) => (x == null ? "" : String(x));
const NUM = (x: any) => (x == null || x === "" || isNaN(Number(x)) ? 0 : Number(x));
const dget = (o: any, paths: string[]) => {
  for (const p of paths) {
    const parts = p.split(".");
    let cur = o;
    let ok = true;
    for (const k of parts) {
      if (!cur || typeof cur !== "object" || !(k in cur)) {
        ok = false;
        break;
      }
      cur = cur[k];
    }
    if (ok) return cur;
  }
  return undefined;
};
const normKey = (k: string) => k.toLowerCase().replace(/[\s_-]+/g, "");

export type Norm = {
  identity?: {
    sun?: string; moon?: string; rising?: string; nakshatra?: string; ayanamsha?: string;
  };
  positions?: Array<{ body: string; sign?: string; degree?: number; house?: number; retro?: boolean; nakshatra?: string }>;
  houses?: Array<{ house: number; sign?: string; lord?: string; degree?: number }>;
  strengths?: Array<{ body: string; score: number }>;
  shadbala?: Array<{ pillar: string; value: number }>;
  bhavaBala?: Array<{ house: number; score: number; benefics?: number; malefics?: number; net?: number }>;
  ashtakavarga?: { headers?: string[]; rows: Array<{ name: string; cells: number[] }>; totals?: number[] };
  aspects?: Array<{ from: string; to: string; type: string }>;
  dashas?: Array<{ system: string; items: Array<{ name: string; from: string; to: string; strength?: number }> }>;
  transits?: Array<{ date: string; hits: Array<{ body: string; target: string; type: string }> }>;
  yogas?: Array<{ title: string; summary: string; tag?: string }>;
  remedies?: Array<{ title: string; summary: string }>;
  doshas?: Array<{ title: string; level: "low" | "med" | "high"; note?: string }>;
  recommendations?: Array<{ title: string; bullets: string[] }>;
  notes?: Array<{ title: string; bullets: string[] }>;
  divisional?: Array<{ name: string; image?: string }>;
  calendar?: Array<{ date: string; tithi?: string; nakshatra?: string; yoga?: string; karana?: string }>;
  charts?: {
    rasiHouses?: Array<{ house: number; sign?: string; bodies?: string[] }>;
    chalitHouses?: Array<{ house: number; bodies?: string[] }>;
    vargas?: Record<string, { asc_idx?: number; houses: string[][] }>;
  };
  predictions?: {
    classicalReading?: string;
    summary?: string;
    categories: Array<{
      key: string;
      title: string;
      summary?: string;
      bullets?: string[];
      score?: number;
      timeframe?: string;
      items?: Array<{ title?: string; text?: string; from?: string; to?: string; score?: number }>;
    }>;
  };
  kundliYogas?: string[];
  tables?: Array<{ title: string; head: string[]; rows: (string | number)[][] }>;
  acg?: {
    advice?: Record<string, string[]>;
    lines?: Record<string, { ASC?: Array<{ lat:number; lon:number }>; DSC?: Array<{ lat:number; lon:number }> }>;
    places?: Array<{ city?: string; country?: string; score?: number; why?: string }>;
  };
  extras?: Record<string, any>;
  raw?: any;
};

/* ---------------- helpers for tables ---------------- */
function asTableFromAny(node: any, title: string): { title: string; head: string[]; rows: (string | number)[][] } | null {
  if (node == null) return null;

  // shape: { title?, head/headers:[], rows/data:[] }
  if (isObj(node) && (Array.isArray(node.head) || Array.isArray(node.headers) || Array.isArray(node.rows) || Array.isArray(node.data))) {
    const head = toArr<string>(node.head ?? node.headers).map(STR);
    const rows = toArr<any>(node.rows ?? node.data).map((r: any) =>
      Array.isArray(r) ? r.map(STR) : Object.values(r ?? {}).map(STR)
    );
    return rows.length ? { title: STR(node.title ?? title), head, rows } : null;
  }

  // shape: array of arrays
  if (Array.isArray(node) && node.every(Array.isArray)) {
    const rows = (node as any[]).map((r: any) => r.map(STR));
    const maxLen = rows.reduce((m, r) => Math.max(m, r.length), 0);
    const head = Array.from({ length: maxLen }, (_, i) => `Col ${i + 1}`);
    return rows.length ? { title, head, rows } : null;
  }

  // shape: array of objects
  if (Array.isArray(node) && node.every(isObj)) {
    const keys = Array.from(new Set((node as AnyObj[]).flatMap(o => Object.keys(o))));
    const head = keys;
    const rows = (node as AnyObj[]).map(o => keys.map(k => STR(o[k])));
    return rows.length ? { title, head, rows } : null;
  }

  // shape: columnar { colA:[...], colB:[...] }
  if (isObj(node)) {
    const keys = Object.keys(node);
    const allArrays = keys.length && keys.every(k => Array.isArray((node as AnyObj)[k]));
    if (allArrays) {
      const len = Math.max(...keys.map(k => ((node as AnyObj)[k] as any[]).length));
      const rows: (string | number)[][] = [];
      for (let i = 0; i < len; i++) rows.push(keys.map(k => STR(((node as AnyObj)[k] as any[])[i])));
      return { title, head: keys, rows };
    }
  }

  return null;
}

export function normalizeCompute(raw: any): Norm {
  if (!raw) return { raw: raw ?? null, extras: {} };

  /* ---------- Basics / Identity ---------- */
  const basics = raw.basics ?? raw.core ?? {};
  const metaAyan = dget(raw, ["basics.ayanamsha","core.ayanamsha","meta.ayanamsha","settings.ayanamsha","config.ayanamsha"]);

  /* ---------- Positions ---------- */
  const posCandidates = [
    raw.positions, raw.planets, raw.placements,
    dget(raw, ["charts.rasi.positions","charts.lagna.positions","charts.rashi.positions"]),
    dget(raw, ["tables.positions"])
  ];
  const positionsRaw = posCandidates.find(Boolean);
  const positions = toArr<any>(positionsRaw).map((p) => ({
    body: STR(p?.body ?? p?.name ?? p?.planet ?? p?.key),
    sign: STR(p?.sign ?? p?.rasi ?? p?.zodiac ?? p?.sign_name),
    degree: NUM(p?.degree ?? p?.deg ?? p?.longitude),
    house: p?.house ?? p?.bhava ?? p?.h ?? undefined,
    retro: !!(p?.retro ?? p?.isRetro ?? p?.R ?? false),
    nakshatra: STR(p?.nakshatra?.name ?? p?.nakshatra ?? p?.star),
  }));

  /* ---------- Houses ---------- */
  const housesRaw = [raw.houses, raw.bhava, dget(raw, ["charts.rasi.houses","charts.lagna.houses","charts.rashi.houses"]), dget(raw, ["tables.houses"])].find(Boolean);
  const houses = toArr<any>(housesRaw).map((h) => ({
    house: NUM(h?.house ?? h?.no ?? h?.index ?? h?.id),
    sign: STR(h?.sign ?? h?.rasi ?? h?.zodiac ?? h?.sign_name),
    lord: STR(h?.lord ?? h?.ruler),
    degree: NUM(h?.degree ?? h?.deg),
  })).filter(h => h.house > 0);

  /* ---------- Identity fields ---------- */
  const sunSign = STR(basics?.sun) || STR(dget(raw, ["identity.sun","signs.sun"])) || positions.find(p => /^(su|sun)$/i.test(p.body))?.sign || "";
  const moonSign = STR(basics?.moon) || STR(dget(raw, ["identity.moon","signs.moon"])) || positions.find(p => /^(mo|moon)$/i.test(p.body))?.sign || "";
  const risingSign = STR(basics?.rising ?? basics?.asc) || STR(dget(raw, ["identity.rising","identity.asc"])) || STR(dget(raw, ["asc.sign","asc.rasi","asc.sign_name"])) || positions.find(p => /^(asc|ascendant)$/i.test(p.body))?.sign || houses.find(h=>h.house===1)?.sign || "";
  const nakshatra = STR(basics?.nakshatra) || STR(dget(raw, ["identity.nakshatra","nakshatra.moon","moon.nakshatra.name"])) || positions.find(p=>/^(mo|moon)$/i.test(p.body))?.nakshatra || "";
  const ayanamsha = STR(metaAyan) || STR(dget(raw, ["ayanamsha","ayanamsa"])) || "";

  /* ---------- Strengths & Balas ---------- */
  const strengths = toArr<any>(raw.strengths ?? raw.planet_strengths).map((s) => ({ body: STR(s?.body ?? s?.name ?? s?.planet), score: NUM(s?.score ?? s?.value ?? s?.points) }));

  const shadbalaRaw = raw.shadbala ?? raw.shad_bala;
  let shadbala: Array<{ pillar: string; value: number }> | undefined;
  if (Array.isArray(shadbalaRaw)) shadbala = shadbalaRaw.map((x: any) => ({ pillar: STR(x?.pillar ?? x?.name), value: NUM(x?.value) }));
  else if (isObj(shadbalaRaw)) shadbala = Object.entries(shadbalaRaw).map(([pillar, value]) => ({ pillar, value: NUM(value) }));

  const bhavaSrc = raw.bhavaBala ?? raw.bhava_bala ?? dget(raw, ["bhava_bala.bhava_bala"]);
  const bhavaBala = toArr<any>(bhavaSrc).map((x) => ({ house: NUM(x?.house ?? x?.no), score: NUM(x?.score ?? x?.value ?? x?.net), benefics: NUM(x?.benefics), malefics: NUM(x?.malefics), net: NUM(x?.net) }));

  /* ---------- Ashtakavarga ---------- */
  let ashtakavarga: Norm["ashtakavarga"] | undefined;
  const ashta = raw.ashtakavarga ?? raw.ashta;
  if (ashta) {
    const headersA = toArr<string>(ashta.headers);
    const rowsA = toArr<any>(ashta.rows).map((r) => ({ name: STR(r?.name ?? r?.row), cells: toArr<number>(r?.cells).map(NUM) }));
    const matrix = (isObj(ashta.planets) && ashta.planets) || (isObj(ashta.pav) && ashta.pav) || (!rowsA.length && isObj(ashta) ? ashta : undefined);
    let rowsB: Array<{ name: string; cells: number[] }> = [];
    if (matrix) {
      rowsB = Object.entries(matrix as AnyObj)
        .filter(([_, v]) => Array.isArray(v) || isObj(v))
        .map(([name, v]) => {
          const arr = Array.isArray(v) ? v : Object.values(v);
          return { name, cells: toArr<number>(arr).map(NUM).slice(0, 12) };
        });
    }
    const headers = headersA.length ? headersA : Array.from({ length: rowsA[0]?.cells?.length || rowsB[0]?.cells?.length || 12 }, (_, i) => `H${i + 1}`);
    const rows = (rowsA.length ? rowsA : rowsB).filter(r => r.cells && r.cells.length);
    const totals = toArr<number>(ashta.sav).map(NUM).slice(0, 12);
    ashtakavarga = rows.length ? { headers, rows, totals: totals.length ? totals : undefined } : undefined;
  }

  /* ---------- Aspects / Dashas / Transits / Text blocks ---------- */
  const aspects = toArr<any>(raw.aspects).map((a) => ({ from: STR(a?.from), to: STR(a?.to), type: STR(a?.type ?? a?.aspect) }));

  let dashas: Norm["dashas"] = [];
  const dashaRaw = raw.dashas ?? raw.dasha;
  if (Array.isArray(dashaRaw)) {
    dashas = dashaRaw.map((d: any) => ({
      system: STR(d?.system ?? d?.name ?? "Dasha"),
      items: toArr<any>(d?.items ?? d?.periods).map((i) => ({ name: STR(i?.name), from: STR(i?.from), to: STR(i?.to), strength: NUM(i?.strength ?? i?.score) })),
    }));
  } else if (isObj(dashaRaw)) {
    dashas = Object.entries(dashaRaw).map(([system, obj]: [string, any]) => {
      const active = obj?.active ?? {};
      const items = Object.entries(active).map(([k, v]: [string, any]) => ({ name: k, from: STR(v?.start), to: STR(v?.end) }));
      return { system, items };
    });
  }

  const transits = toArr<any>(raw.transits).map((t) => ({ date: STR(t?.date), hits: toArr<any>(t?.hits).map((h) => ({ body: STR(h?.body), target: STR(h?.target), type: STR(h?.type) })) }));

  const yogas = toArr<any>(raw.yogas).map((y) => ({ title: STR(y?.title ?? y?.name), summary: STR(y?.summary ?? y?.desc), tag: STR(y?.tag) || undefined }));
  const remedies = toArr<any>(raw.remedies ?? raw.upaya).map((r) => ({ title: STR(r?.title ?? r?.name), summary: STR(r?.summary ?? r?.desc) }));
  const doshas = toArr<any>(raw.doshas).map((d) => ({ title: STR(d?.title ?? d?.name), level: (STR(d?.level) as any) || "med", note: STR(d?.note) || undefined }));
  const recommendations = toArr<any>(raw.recommendations ?? raw.tips).map((t) => ({ title: STR(t?.title), bullets: toArr<any>(t?.bullets).map(STR) }));
  const notes = toArr<any>(raw.notes ?? raw.insights).map((n) => ({ title: STR(n?.title), bullets: toArr<any>(n?.bullets).map(STR) }));
  const divisional = toArr<any>(raw.divisional ?? raw.varga).map((v) => ({ name: STR(v?.name), image: STR(v?.image) || undefined }));
  const calendar = toArr<any>(raw.calendar ?? raw.panchanga).map((c) => ({ date: STR(c?.date), tithi: STR(c?.tithi), nakshatra: STR(c?.nakshatra), yoga: STR(c?.yoga), karana: STR(c?.karana) }));

  /* ---------- Charts ---------- */
  let chartsRasiHouses: Array<{ house: number; sign?: string; bodies?: string[] }> | undefined;
  let chalitHouses: Array<{ house: number; bodies?: string[] }> | undefined;
  const charts = raw.charts ?? {};
  const rashi = charts.rashi ?? charts.rasi;
  if (Array.isArray(rashi)) {
    chartsRasiHouses = rashi.map((arr: any[], i: number) => ({ house: i + 1, bodies: toArr(arr).map(STR) }));
  } else if (isObj(charts.rashi?.houses)) {
    const arr = toArr<any>(charts.rashi.houses);
    chartsRasiHouses = arr.map((h: any, i: number) => ({ house: NUM(h?.house ?? i + 1), sign: STR(h?.sign), bodies: toArr(h?.bodies ?? h?.planets).map(STR) }));
  }
  const chalit = charts.chalit;
  if (Array.isArray(chalit)) {
    chalitHouses = chalit.map((arr: any[], i: number) => ({ house: i + 1, bodies: toArr(arr).map(STR) }));
  }
  const vargas = isObj(charts.vargas) ? charts.vargas : undefined;

  /* ---------- Kundli predictions ---------- */
  const kp = raw.kundli_predictions ?? raw.kundliPredictions ?? raw.predictions ?? raw.kundli ?? undefined;

  let predictions: Norm["predictions"] | undefined;
  let kundliYogas: string[] | undefined;

  if (kp) {
    const keys = Object.keys(kp);
    const classicalKey = keys.find((k) => {
      const nk = normKey(k);
      return nk === "classicalreading" || nk === "classical";
    });

    const getTextFromAny = (val: any): string => {
      if (val == null) return "";
      if (typeof val === "string") return val;
      if (Array.isArray(val)) return val.map(STR).join("\n\n");
      if (isObj(val)) {
        const s = val.summary ?? val.text ?? val.content;
        if (typeof s === "string") return s;
        const para = toArr<string>(val.paragraphs).map(STR).join("\n\n");
        return para;
      }
      return STR(val);
    };

    const classicalReading = classicalKey ? getTextFromAny(kp[classicalKey]) : "";
    const summary = STR(kp.summary ?? kp.overall ?? kp.overview ?? kp.highlights);

    const yogasKey = keys.find((k) => normKey(k) === "yogas" || normKey(k) === "yoga");
    if (yogasKey) {
      const v = kp[yogasKey];
      if (Array.isArray(v)) {
        kundliYogas = v.map((x: any) =>
          typeof x === "string" ? x : STR(x?.title ?? x?.name ?? x?.text ?? x?.summary)
        ).filter(Boolean);
      } else if (typeof v === "string") {
        kundliYogas = [v];
      }
    }

    const blacklist = new Set(["summary","overall","overview","highlights","categories"]);
    if (classicalKey) blacklist.add(classicalKey);
    if (yogasKey) blacklist.add(yogasKey);

    const catEntries: Array<[string, any]> = Array.isArray(kp.categories)
      ? kp.categories.map((c: any, i: number) => [c?.key ?? `cat_${i}`, c])
      : isObj(kp)
        ? Object.entries(kp).filter(([k]) => !blacklist.has(k))
        : [];

    const categories = catEntries.map(([key, c]) => {
      if (typeof c === "string") {
        const t = key.replace(/_/g, " ");
        return { key, title: t.charAt(0).toUpperCase() + t.slice(1), summary: c };
      }
      if (Array.isArray(c)) {
        const t = key.replace(/_/g, " ");
        return { key, title: t.charAt(0).toUpperCase() + t.slice(1), bullets: c.map(STR) };
      }
      const title = STR(c?.title ?? key.replace(/_/g, " "));
      const richText =
        STR(c?.summary ?? c?.desc ?? c?.text ?? c?.content) ||
        toArr<string>(c?.paragraphs).map(STR).join("\n\n");
      const bullets = toArr<any>(c?.bullets ?? c?.points ?? c?.tips).map(STR);
      const items = toArr<any>(c?.items ?? c?.timeline)
        .map((it: any) => ({
          title: STR(it?.title ?? it?.name),
          text: STR(it?.text ?? it?.desc),
          from: STR(it?.from ?? it?.start),
          to: STR(it?.to ?? it?.end),
          score: NUM(it?.score),
        }))
        .filter((it) => it.title || it.text || it.from || it.to);

      const rawScore = c?.score ?? c?.rating;
      const score = rawScore == null || rawScore === "" ? undefined : Number(rawScore);

      return {
        key,
        title: title.charAt(0).toUpperCase() + title.slice(1),
        summary: richText || undefined,
        bullets: bullets.length ? bullets : undefined,
        score,
        timeframe: STR(c?.timeframe ?? c?.window) || undefined,
        items: items.length ? items : undefined,
      };
    }).filter(Boolean);

    predictions = {
      classicalReading: classicalReading || undefined,
      summary: summary || undefined,
      categories,
    };
  }

  /* ---------- Tables (now fully robust, incl. key "table") ---------- */
  const tables: Norm["tables"] = [];
  const push = (t: { title: string; head: string[]; rows: (string | number)[][] } | null) => { if (t && t.rows?.length) tables.push(t); };

  const tableRoot = raw.tables ?? raw.tabular ?? raw.table; // includes "table"
  if (tableRoot != null) {
    if (Array.isArray(tableRoot)) {
      // array could be tables, arrays, or objects
      tableRoot.forEach((node: any, i: number) => push(asTableFromAny(node, `Table ${i + 1}`)));
    } else if (isObj(tableRoot)) {
      // might be a single table object or a dict of tables
      const single = asTableFromAny(tableRoot, "Table");
      if (single) {
        push(single);
      } else {
        Object.entries(tableRoot).forEach(([key, node], i) => {
          push(asTableFromAny(node, STR(key || `Table ${i + 1}`)));
        });
      }
    }
  }

  // If nothing provided, synthesize from positions/houses
  if (!tables.length && positions?.length) {
    tables.push({
      title: "Planetary Positions",
      head: ["Body","Sign","Degree","House","Retro","Nakshatra"],
      rows: positions.map(p => [p.body, p.sign ?? "—", p.degree?.toFixed(2) ?? "—", p.house ?? "—", p.retro ? "R" : "", p.nakshatra ?? "—"])
    });
  }
  if (!tables.length && houses?.length) {
    tables.push({
      title: "Houses",
      head: ["House","Sign","Lord","Degree"],
      rows: houses.map(h => [h.house, h.sign ?? "—", h.lord ?? "—", h.degree ?? "—"])
    });
  }

  /* ---------- ACG ---------- */
  const rawACG = raw.acg ?? raw.ACG ?? raw.astro_cartography ?? raw.astroCartography;
  let acg: Norm["acg"] | undefined;
  if (rawACG) {
    const lines = rawACG.lines ?? {};
    const safe: any = {};
    Object.keys(lines || {}).forEach((planet) => {
      const L = lines[planet] || {};
      safe[planet] = { ASC: toArr(L.ASC), DSC: toArr(L.DSC) };
    });
    const placesRaw = rawACG.places ?? rawACG.cities ?? rawACG.recommendations ?? rawACG.best_places;
    const places = placesRaw ? toArr<any>(placesRaw).map((p) => ({
      city: STR(p?.city ?? p?.name),
      country: STR(p?.country),
      score: NUM(p?.score ?? p?.rank),
      why: STR(p?.why ?? p?.reason ?? p?.note),
    })) : undefined;
    const advice = isObj(rawACG.advice) ? (rawACG.advice as Record<string, string[]>) : undefined;
    acg = { advice, lines: Object.keys(safe).length ? safe : undefined, places };
  }

  /* ---------- EXTRAS ---------- */
  const known = new Set([
    "basics","core","positions","planets","placements","houses","bhava","strengths","planet_strengths",
    "shadbala","shad_bala","bhavaBala","bhava_bala","ashtakavarga","ashta","aspects","dashas","dasha",
    "transits","yogas","remedies","upaya","doshas","recommendations","tips","notes","insights",
    "divisional","varga","calendar","panchanga","charts","asc",
    "tables","tabular","table",
    "kundli_predictions","kundliPredictions","predictions","kundli",
    "acg","ACG","astro_cartography","astroCartography",
  ]);
  const extras: Record<string, any> = {};
  Object.keys(raw).forEach((k) => { if (!known.has(k)) extras[k] = raw[k]; });

  return {
    identity: { sun: sunSign || undefined, moon: moonSign || undefined, rising: risingSign || undefined, nakshatra: nakshatra || undefined, ayanamsha: ayanamsha || undefined },
    positions: positions.length ? positions : undefined,
    houses: houses.length ? houses : undefined,
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
    charts: (chartsRasiHouses || chalitHouses || vargas) ? { rasiHouses: chartsRasiHouses, chalitHouses, vargas } : undefined,
    predictions,
    kundliYogas,
    tables: tables.length ? tables : undefined,
    acg,
    extras,
    raw,
  };
}
