// components/results/normalizeCompute.ts
type AnyObj = Record<string, any>;
const isObj = (x: any) => x && typeof x === "object" && !Array.isArray(x);
const toArr = <T = any>(x: any): T[] => (Array.isArray(x) ? x : x ? [x] : []);
const STR = (x: any) => (x === null || x === undefined ? "" : String(x));
const NUM = (x: any) => (x === null || x === undefined || isNaN(Number(x)) ? 0 : Number(x));
const dget = (o: any, paths: string[]) => {
    for (const p of paths) {
        const parts = p.split(".");
        let cur = o;
        let ok = true;
        for (const k of parts) {
            if (!cur || typeof cur !== "object" || !(k in cur)) { ok = false; break; }
            cur = cur[k];
        }
        if (ok) return cur;
    }
    return undefined;
};


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
        summary?: string;
        categories: Array<{
            key: string;
            title: string;
            summary?: string;
            bullets?: string[];
            score?: number;            // 0..100 or 1..5 – we just display
            timeframe?: string;        // e.g., "next 3 months"
            items?: Array<{            // optional granular predictions
                title?: string;
                text?: string;
                from?: string;
                to?: string;
                score?: number;
            }>;
        }>;
    };
    acg?: {
        advice?: Record<string, string[]>;
        lines?: Record<string, { ASC?: Array<{ lat: number; lon: number }>; DSC?: Array<{ lat: number; lon: number }> }>;
        places?: Array<{ city?: string; country?: string; score?: number; why?: string }>;
    };
    raw?: any;
};

export function normalizeCompute(raw: any): Norm {
    if (!raw) return { raw: raw ?? null };

    const basics = raw.basics ?? raw.core ?? {};
    const metaAyan = dget(raw, [
        "basics.ayanamsha", "core.ayanamsha",
        "meta.ayanamsha", "settings.ayanamsha", "config.ayanamsha"
    ]);

    /* KUNDLI PREDICTIONS */
    const kp = raw.kundli_predictions ?? raw.predictions ?? raw.kundli ?? undefined;
    let predictions: Norm["predictions"] | undefined;
    if (kp) {
        const summary =
            STR(kp.summary ?? kp.overall ?? kp.overview ?? kp.highlights);

        // normalize categories from common shapes:
        // - object: { career: {...}, love: {...}, ... }
        // - array:  [ { key: "career", title: "...", ... }, ... ]
        const catEntries: Array<[string, any]> = Array.isArray(kp.categories)
            ? kp.categories.map((c: any, i: number) => [c?.key ?? `cat_${i}`, c])
            : isObj(kp)
                ? Object.entries(kp).filter(([k]) => !["summary", "overall", "overview", "highlights", "categories"].includes(k))
                : [];

        const categories = catEntries.map(([key, c]) => {
            const title = STR(c?.title ?? key.replace(/_/g, " "));
            const bullets = toArr<any>(c?.bullets ?? c?.points ?? c?.tips).map(STR);
            const items = toArr<any>(c?.items ?? c?.timeline).map((it: any) => ({
                title: STR(it?.title ?? it?.name),
                text: STR(it?.text ?? it?.desc),
                from: STR(it?.from ?? it?.start),
                to: STR(it?.to ?? it?.end),
                score: NUM(it?.score),
            }));
            return {
                key,
                title: title.charAt(0).toUpperCase() + title.slice(1),
                summary: STR(c?.summary ?? c?.desc ?? c?.text),
                bullets,
                score: NUM(c?.score ?? c?.rating),
                timeframe: STR(c?.timeframe ?? c?.window),
                items: items.length ? items : undefined,
            };
        }).filter(Boolean);

        predictions = {
            summary: summary || undefined,
            categories,
        };
    }

    /* ACG places/cities (optional) */
    let acgPlaces: Array<{ city?: string; country?: string; score?: number; why?: string }> | undefined;
    const placesRaw =
        raw.acg?.places ??
        raw.acg?.cities ??
        raw.acg?.recommendations ??
        raw.acg?.best_places;

    if (placesRaw) {
        acgPlaces = toArr<any>(placesRaw).map((p) => ({
            city: STR(p?.city ?? p?.name),
            country: STR(p?.country),
            score: NUM(p?.score ?? p?.rank),
            why: STR(p?.why ?? p?.reason ?? p?.note),
        }));
    }
    /* POSITIONS */
    const posCandidates = [
        raw.positions, raw.planets, raw.placements,
        dget(raw, ["charts.rasi.positions", "charts.lagna.positions", "charts.rashi.positions"]),
        dget(raw, ["tables.positions"]),
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

    /* HOUSES */
    const housesRaw = [
        raw.houses, raw.bhava,
        dget(raw, ["charts.rasi.houses", "charts.lagna.houses", "charts.rashi.houses"]),
        dget(raw, ["tables.houses"]),
    ].find(Boolean);
    const houses = toArr<any>(housesRaw).map((h) => ({
        house: NUM(h?.house ?? h?.no ?? h?.index ?? h?.id),
        sign: STR(h?.sign ?? h?.rasi ?? h?.zodiac ?? h?.sign_name),
        lord: STR(h?.lord ?? h?.ruler),
        degree: NUM(h?.degree ?? h?.deg),
    })).filter(h => h.house > 0);

    /* IDENTITY */
    const sunSign =
        STR(basics?.sun) ||
        STR(dget(raw, ["identity.sun", "signs.sun"])) ||
        positions.find(p => /^(su|sun)$/i.test(p.body))?.sign || "";

    const moonSign =
        STR(basics?.moon) ||
        STR(dget(raw, ["identity.moon", "signs.moon"])) ||
        positions.find(p => /^(mo|moon)$/i.test(p.body))?.sign || "";

    const risingSign =
        STR(basics?.rising ?? basics?.asc) ||
        STR(dget(raw, ["identity.rising", "identity.asc"])) ||
        STR(dget(raw, ["asc.sign", "asc.rasi", "asc.sign_name"])) ||
        positions.find(p => /^(asc|ascendant)$/i.test(p.body))?.sign ||
        houses.find(h => h.house === 1)?.sign || "";

    const nakshatra =
        STR(basics?.nakshatra) ||
        STR(dget(raw, ["identity.nakshatra", "nakshatra.moon", "moon.nakshatra.name"])) ||
        positions.find(p => /^(mo|moon)$/i.test(p.body))?.nakshatra || "";

    const ayanamsha = STR(metaAyan) || STR(dget(raw, ["ayanamsha", "ayanamsa"])) || "";

    /* STRENGTHS */
    const strengths = toArr<any>(raw.strengths ?? raw.planet_strengths).map((s) => ({
        body: STR(s?.body ?? s?.name ?? s?.planet),
        score: NUM(s?.score ?? s?.value ?? s?.points),
    }));

    /* SHADBALA */
    const shadbalaRaw = raw.shadbala ?? raw.shad_bala;
    let shadbala: Array<{ pillar: string; value: number }> | undefined;
    if (Array.isArray(shadbalaRaw)) {
        shadbala = shadbalaRaw.map((x: any) => ({ pillar: STR(x?.pillar ?? x?.name), value: NUM(x?.value) }));
    } else if (isObj(shadbalaRaw)) {
        shadbala = Object.entries(shadbalaRaw).map(([pillar, value]) => ({ pillar, value: NUM(value) }));
    }

    /* BHAVA BALA (supports nested bhava_bala.bhava_bala) */
    const bhavaSrc = raw.bhavaBala ?? raw.bhava_bala ?? dget(raw, ["bhava_bala.bhava_bala"]);
    const bhavaBala = toArr<any>(bhavaSrc).map((x) => ({
        house: NUM(x?.house ?? x?.no),
        score: NUM(x?.score ?? x?.value ?? x?.net),
        benefics: NUM(x?.benefics),
        malefics: NUM(x?.malefics),
        net: NUM(x?.net),
    }));

    /* ASHTAKAVARGA (rows/headers OR planet matrix under ashtakavarga.pav; totals from sav) */
    let ashtakavarga: Norm["ashtakavarga"] | undefined;
    const ashta = raw.ashtakavarga ?? raw.ashta;
    if (ashta) {
        const headersA = toArr<string>(ashta.headers);
        const rowsA = toArr<any>(ashta.rows).map((r) => ({
            name: STR(r?.name ?? r?.row),
            cells: toArr<number>(r?.cells).map(NUM),
        }));

        // Planet matrix formats: { planets:{Sun:[..]} } or { pav:{Sun:[..]} } or top-level keys
        const matrix =
            (isObj(ashta.planets) && ashta.planets) ||
            (isObj(ashta.pav) && ashta.pav) ||
            (!rowsA.length && isObj(ashta) ? ashta : undefined);

        let rowsB: Array<{ name: string; cells: number[] }> = [];
        if (matrix) {
            rowsB = Object.entries(matrix as AnyObj)
                .filter(([k, v]) => Array.isArray(v) || isObj(v))
                .map(([name, v]) => {
                    const arr = Array.isArray(v) ? v : Object.values(v);
                    return { name, cells: toArr<number>(arr).map(NUM).slice(0, 12) };
                });
        }

        const headers =
            headersA.length
                ? headersA
                : Array.from({ length: rowsA[0]?.cells?.length || rowsB[0]?.cells?.length || 12 }, (_, i) => `H${i + 1}`);

        const rows = (rowsA.length ? rowsA : rowsB).filter(r => r.cells && r.cells.length);
        const totals = toArr<number>(ashta.sav).map(NUM).slice(0, 12);

        ashtakavarga = rows.length ? { headers, rows, totals: totals.length ? totals : undefined } : undefined;
    }

    /* ASPECTS / DASHAS / TRANSITS / TEXTUALS */
    const aspects = toArr<any>(raw.aspects).map((a) => ({ from: STR(a?.from), to: STR(a?.to), type: STR(a?.type ?? a?.aspect) }));

    // dasha can be array or object keyed by system
    let dashas: Norm["dashas"] = [];
    const dashaRaw = raw.dashas ?? raw.dasha;
    if (Array.isArray(dashaRaw)) {
        dashas = dashaRaw.map((d: any) => ({
            system: STR(d?.system ?? d?.name ?? "Dasha"),
            items: toArr<any>(d?.items ?? d?.periods).map((i) => ({
                name: STR(i?.name), from: STR(i?.from), to: STR(i?.to), strength: NUM(i?.strength ?? i?.score)
            })),
        }));
    } else if (isObj(dashaRaw)) {
        dashas = Object.entries(dashaRaw).map(([system, obj]: [string, any]) => {
            const active = obj?.active ?? {};
            const items = Object.entries(active).map(([k, v]: [string, any]) => ({
                name: k, from: STR(v?.start), to: STR(v?.end),
            }));
            return { system, items };
        });
    }

    const transits = toArr<any>(raw.transits).map((t) => ({
        date: STR(t?.date),
        hits: toArr<any>(t?.hits).map((h) => ({ body: STR(h?.body), target: STR(h?.target), type: STR(h?.type) })),
    }));

    const yogas = toArr<any>(raw.yogas).map((y) => ({ title: STR(y?.title ?? y?.name), summary: STR(y?.summary ?? y?.desc), tag: STR(y?.tag) || undefined }));
    const remedies = toArr<any>(raw.remedies ?? raw.upaya).map((r) => ({ title: STR(r?.title ?? r?.name), summary: STR(r?.summary ?? r?.desc) }));
    const doshas = toArr<any>(raw.doshas).map((d) => ({ title: STR(d?.title ?? d?.name), level: (STR(d?.level) as any) || "med", note: STR(d?.note) || undefined }));
    const recommendations = toArr<any>(raw.recommendations ?? raw.tips).map((t) => ({ title: STR(t?.title), bullets: toArr<any>(t?.bullets).map(STR) }));
    const notes = toArr<any>(raw.notes ?? raw.insights).map((n) => ({ title: STR(n?.title), bullets: toArr<any>(n?.bullets).map(STR) }));
    const divisional = toArr<any>(raw.divisional ?? raw.varga).map((v) => ({ name: STR(v?.name), image: STR(v?.image) || undefined }));
    const calendar = toArr<any>(raw.calendar ?? raw.panchanga).map((c) => ({ date: STR(c?.date), tithi: STR(c?.tithi), nakshatra: STR(c?.nakshatra), yoga: STR(c?.yoga), karana: STR(c?.karana) }));

    /* CHARTS → rashi/chalit as 12-box; vargas passthrough */
    let chartsRasiHouses: Array<{ house: number; sign?: string; bodies?: string[] }> | undefined;
    let chalitHouses: Array<{ house: number; bodies?: string[] }> | undefined;
    const charts = raw.charts ?? {};
    const rashi = charts.rashi ?? charts.rasi;
    if (Array.isArray(rashi)) {
        chartsRasiHouses = rashi.map((arr: any[], i: number) => ({ house: i + 1, bodies: toArr(arr).map(STR) }));
    }
    const chalit = charts.chalit;
    if (Array.isArray(chalit)) {
        chalitHouses = chalit.map((arr: any[], i: number) => ({ house: i + 1, bodies: toArr(arr).map(STR) }));
    }
    const vargas = isObj(charts.vargas) ? charts.vargas : undefined;

    /* ACG */
    let acg: Norm["acg"] | undefined;
    if (raw.acg) {
        const lines = raw.acg.lines ?? {};
        const safe: any = {};
        Object.keys(lines || {}).forEach((planet) => {
            const L = lines[planet] || {};
            safe[planet] = { ASC: toArr(L.ASC), DSC: toArr(L.DSC) };
        });
        acg = { advice: isObj(raw.acg.advice) ? raw.acg.advice : undefined, lines: Object.keys(safe).length ? safe : undefined };
    }

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
        predictions: (predictions && (predictions.summary || predictions.categories?.length)) ? predictions : undefined,
        acg: (acg || acgPlaces) ? { advice: acg?.advice, lines: acg?.lines, places: acgPlaces } : undefined,
        raw,
    };
}
