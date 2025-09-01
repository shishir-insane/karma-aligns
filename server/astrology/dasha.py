from datetime import datetime, timedelta, timezone
from typing import List, Dict, Optional, Tuple
from .nakshatra import get_nakshatra_name, get_pada

# --- Vimśottarī -----------------------------------------------------------
# Sequence and durations (years)
VIMS_LORDS = ["Ketu","Venus","Sun","Moon","Mars","Rahu","Jupiter","Saturn","Mercury"]
VIMS_YEARS = [7,       20,     6,    10,    7,     18,     16,       19,       17]
NAKSH_PER_LORD = dict(zip(VIMS_LORDS, VIMS_YEARS))

# One nakshatra = 13°20' = 13.333... deg
NAK_SIZE = 360.0 / 27.0
DAYS_PER_YEAR = 365.2425  # civil tropical year approximation for timelines

# --- Yoginī -----------------------------------------------------------
# Order & durations (years) sum to 36
YOG_NAMES  = ["Mangala","Pingala","Dhanya","Bhramari","Bhadrika","Ulka","Siddha","Sankata"]
YOG_YEARS  = [   1,        2,        3,        4,          5,       6,      7,        8  ]
# Classical planetary lords
YOG_LORDS  = ["Moon","Sun","Jupiter","Mars","Mercury","Saturn","Venus","Rahu"]

# Pada (1..4) → starting Yoginī index in YOG_NAMES
YOG_START_FROM_PADA = {1:0, 2:1, 3:2, 4:3}
PADA_SIZE = NAK_SIZE / 4.0  # 3°20′

# --- Aṣṭottarī (108-year) ---------------------------------------------
ASHT_LORDS = ["Sun","Moon","Mars","Mercury","Saturn","Jupiter","Rahu","Venus"]
ASHT_YEARS = [   6,    15,     8,       17,       10,        19,      12,    21]

# Aṣṭottarī applicability: Janma-nakshatra lord must be one of:
ASHT_ALLOWED_START = {"Sun","Moon","Mars","Jupiter"}

# --- Kalacakra ---------------------------------------------------------
KCD_YEARS = {
    "Aries":7,"Taurus":16,"Gemini":9,"Cancer":21,"Leo":5,"Virgo":9,
    "Libra":16,"Scorpio":7,"Sagittarius":10,"Capricorn":4,"Aquarius":4,"Pisces":10
}
KCD_SIGN_LORD = {
    "Aries":"Mars","Taurus":"Venus","Gemini":"Mercury","Cancer":"Moon",
    "Leo":"Sun","Virgo":"Mercury","Libra":"Venus","Scorpio":"Mars",
    "Sagittarius":"Jupiter","Capricorn":"Saturn","Aquarius":"Saturn","Pisces":"Jupiter"
}

# Group membership by nakshatra (normalize to your nakshatra.py names)
KCD_GROUP = {
    # Savya groups
    "Ashwini":"S1","Punarvasu":"S1","Hasta":"S1","Mula":"S1","Purva Bhadrapada":"S1",
    "Bharani":"S2","Pushya":"S2","Chitra":"S2","Purva Ashadha":"S2","Uttara Bhadrapada":"S2",
    "Krittika":"S3","Ashlesha":"S3","Swati":"S3","Uttara Ashadha":"S3","Revati":"S3",
    # Apsavya groups
    "Rohini":"A1","Magha":"A1","Vishakha":"A1","Shravana":"A1",
    "Mrigashira":"A2","Purva Phalguni":"A2","Anuradha":"A2","Dhanishta":"A2",
    "Ardra":"A3","Uttara Phalguni":"A3","Jyeshtha":"A3","Shatabhisha":"A3",
}

# Helper for compact sign labels → full names
def _S(*abbrs):
    m = {"Ari":"Aries","Tau":"Taurus","Gem":"Gemini","Can":"Cancer","Leo":"Leo","Vir":"Virgo",
         "Lib":"Libra","Sco":"Scorpio","Sag":"Sagittarius","Cap":"Capricorn","Aqu":"Aquarius","Pis":"Pisces"}
    return [m[a] for a in abbrs]

# Savya (S1,S2,S3) & Apsavya (A1,A2,A3) tables: per pada (1..4): seq (9 rasis), paramayus, deha, jeeva
KCD_TABLES = {
    # --- Savya groups (order of columns: Paramāyu, Deha, Jeeva) ---
    "S1": {  # Ashwini, Punarvasu, Hasta, Mula, Purva Bhadrapada
        1: {"seq": _S("Ari","Tau","Gem","Can","Leo","Vir","Lib","Sco","Sag"), "param":100, "deha":"Aries", "jeeva":"Sagittarius"},
        2: {"seq": _S("Cap","Aqu","Pis","Sco","Lib","Vir","Can","Leo","Gem"), "param":85,  "deha":"Taurus","jeeva":"Cancer"},
        3: {"seq": _S("Tau","Ari","Pis","Aqu","Cap","Sag","Ari","Tau","Gem"), "param":83,  "deha":"Taurus","jeeva":"Gemini"},
        4: {"seq": _S("Can","Leo","Vir","Lib","Sco","Sag","Cap","Aqu","Pis"), "param":86,  "deha":"Cancer","jeeva":"Pisces"},
    },
    "S2": {  # Bharani, Pushya, Chitra, Purva Ashadha, Uttara Bhadrapada
        1: {"seq": _S("Sco","Lib","Vir","Can","Leo","Gem","Tau","Ari","Pis"), "param":100, "deha":"Scorpio","jeeva":"Pisces"},
        2: {"seq": _S("Aqu","Cap","Sag","Ari","Tau","Gem","Can","Leo","Vir"), "param":85,  "deha":"Aquarius","jeeva":"Virgo"},
        3: {"seq": _S("Lib","Sco","Sag","Cap","Aqu","Pis","Sco","Lib","Vir"), "param":83,  "deha":"Libra","jeeva":"Virgo"},
        4: {"seq": _S("Can","Leo","Gem","Tau","Ari","Pis","Aqu","Cap","Sag"), "param":86,  "deha":"Cancer","jeeva":"Sagittarius"},
    },
    "S3": {  # Krittika, Ashlesha, Swati, Uttara Ashadha, Revati
        1: {"seq": _S("Ari","Tau","Gem","Can","Leo","Vir","Lib","Sco","Sag"), "param":100, "deha":"Aries","jeeva":"Sagittarius"},
        2: {"seq": _S("Cap","Aqu","Pis","Sco","Lib","Vir","Can","Leo","Gem"), "param":85,  "deha":"Taurus","jeeva":"Cancer"},
        3: {"seq": _S("Tau","Ari","Pis","Aqu","Cap","Sag","Ari","Tau","Gem"), "param":83,  "deha":"Taurus","jeeva":"Gemini"},
        4: {"seq": _S("Can","Leo","Vir","Lib","Sco","Sag","Cap","Aqu","Pis"), "param":86,  "deha":"Cancer","jeeva":"Pisces"},
    },
    # --- Apsavya groups (order of columns: Paramāyu, Jeeva, Deha) ---
    "A1": {  # Rohini, Magha, Vishakha, Shravana
        1: {"seq": _S("Sag","Cap","Aqu","Pis","Ari","Tau","Gem","Leo","Can"), "param":86,  "jeeva":"Sagittarius","deha":"Cancer"},
        2: {"seq": _S("Vir","Lib","Sco","Pis","Aqu","Cap","Sag","Sco","Lib"), "param":83,  "jeeva":"Virgo","deha":"Libra"},
        3: {"seq": _S("Vir","Leo","Can","Gem","Tau","Ari","Sag","Cap","Aqu"), "param":85,  "jeeva":"Virgo","deha":"Aquarius"},
        4: {"seq": _S("Pis","Ari","Tau","Gem","Leo","Can","Vir","Lib","Sco"), "param":100, "jeeva":"Pisces","deha":"Scorpio"},
    },
    "A2": {  # Mrigashira, Purva Phalguni, Anuradha, Dhanishta
        1: {"seq": _S("Pis","Aqu","Cap","Sag","Sco","Lib","Vir","Leo","Can"), "param":86,  "jeeva":"Pisces","deha":"Cancer"},
        2: {"seq": _S("Gem","Tau","Ari","Sag","Cap","Aqu","Pis","Ari","Tau"), "param":83,  "jeeva":"Gemini","deha":"Taurus"},
        3: {"seq": _S("Gem","Leo","Can","Vir","Lib","Sco","Pis","Aqu","Cap"), "param":85,  "jeeva":"Gemini","deha":"Capricorn"},
        4: {"seq": _S("Sag","Sco","Lib","Vir","Leo","Can","Gem","Tau","Ari"), "param":100, "jeeva":"Sagittarius","deha":"Aries"},
    },
    "A3": {  # Ardra, Uttara Phalguni, Jyeshtha, Shatabhisha
        1: {"seq": _S("Sag","Cap","Aqu","Pis","Ari","Tau","Gem","Leo","Can"), "param":86,  "jeeva":"Sagittarius","deha":"Cancer"},
        2: {"seq": _S("Vir","Lib","Sco","Pis","Aqu","Cap","Sag","Sco","Lib"), "param":83,  "jeeva":"Virgo","deha":"Libra"},
        3: {"seq": _S("Vir","Leo","Can","Gem","Tau","Ari","Sag","Cap","Aqu"), "param":85,  "jeeva":"Virgo","deha":"Aquarius"},
        4: {"seq": _S("Pis","Ari","Tau","Gem","Leo","Can","Vir","Lib","Sco"), "param":100, "jeeva":"Pisces","deha":"Scorpio"},
    },
}



def _to_utc(dt_local: datetime, tz_hours: float) -> datetime:
    dt_utc = dt_local - timedelta(hours=tz_hours)
    # ensure timezone-aware UTC
    if dt_utc.tzinfo is None:
        return dt_utc.replace(tzinfo=timezone.utc)
    return dt_utc.astimezone(timezone.utc)


def _frac_in_nak(lon: float) -> float:
    """Return fraction (0..1) progressed within current nakshatra (sidereal long)."""
    off = lon % NAK_SIZE
    return off / NAK_SIZE

def _vims_start_index(moon_lon: float) -> int:
    """Index (0..8) of Vimśottarī mahādasha lord from Moon's nakshatra."""
    nak_index = int((moon_lon % 360.0) // NAK_SIZE)  # 0..26
    # Each group of 3 nakshatras belongs to same lord, in cyclic order
    return nak_index % 9

def _roll(seq: List, start: int) -> List:
    return seq[start:] + seq[:start]

def _span(start: datetime, years: float) -> Tuple[datetime, datetime]:
    dur_days = years * DAYS_PER_YEAR
    end = start + timedelta(days=dur_days)
    return start, end

def _build_md_list(birth_utc: datetime, moon_lon: float) -> List[Dict]:
    """Build full Vimśottarī MD timeline from birth."""
    sidx = _vims_start_index(moon_lon)
    order = _roll(VIMS_LORDS, sidx)
    order_years = _roll(VIMS_YEARS, sidx)

    # Remaining balance of first MD
    frac = _frac_in_nak(moon_lon)
    first_total = order_years[0]
    rem_years = (1.0 - frac) * first_total

    md_list = []
    cur_start = birth_utc
    # First MD truncated to remaining balance
    s, e = _span(cur_start, rem_years)
    md_list.append({"lord": order[0], "start": s, "end": e})
    cur_start = e

    # Subsequent full MDs (we’ll cover ~200 years to be safe)
    cyc = order[1:] + order  # infinite-ish by wrap logic
    cyc_years = order_years[1:] + order_years
    # Build until ~180 years after birth
    i = 0
    while (cur_start - birth_utc).days < int(180 * DAYS_PER_YEAR):
        lord = cyc[i % len(cyc)]
        yrs = cyc_years[i % len(cyc_years)]
        s, e = _span(cur_start, yrs)
        md_list.append({"lord": lord, "start": s, "end": e})
        cur_start = e
        i += 1

    return md_list

def _in_span(dt: datetime, start: datetime, end: datetime) -> bool:
    return (dt >= start) and (dt < end)

def _subperiods(parent: Dict, lord_seq: List[str], years_seq: List[int]) -> List[Dict]:
    """Generic AD/PD builder over a parent period using lord_seq & durations (years)."""
    start, end = parent["start"], parent["end"]
    parent_days = (end - start).total_seconds() / 86400.0
    total_years = sum(years_seq)
    out = []
    cur = start
    for lord, yrs in zip(lord_seq, years_seq):
        frac = yrs / total_years
        dur_days = parent_days * frac
        s = cur
        e = s + timedelta(days=dur_days)
        out.append({"lord": lord, "start": s, "end": e})
        cur = e
    return out



def _yog_start_index_from_pada(moon_lon: float) -> int:
    """Map Moon's pada (1..4) → starting Yoginī index 0..3 (Mangala..Bhramari)."""
    p = get_pada(moon_lon)
    return YOG_START_FROM_PADA.get(p, 0)

def _frac_in_pada(moon_lon: float) -> float:
    """Fraction (0..1) progressed within current pada of Moon's nakshatra."""
    # progress within current nakshatra
    prog_in_nak = (moon_lon % NAK_SIZE)
    prog_in_pada = prog_in_nak % PADA_SIZE
    return prog_in_pada / PADA_SIZE

def _roll2(names: list, years: list, start: int) -> tuple[list, list]:
    return names[start:] + names[:start], years[start:] + years[:start]

def _build_yogini_md_list(birth_utc: datetime, moon_lon: float) -> List[Dict]:
    """
    Build Yoginī MD timeline starting at Yoginī determined by Moon's pada,
    truncating the first MD by remaining fraction of that pada.
    """
    sidx = _yog_start_index_from_pada(moon_lon)  # 0..3
    order_names, order_years = _roll2(YOG_NAMES, YOG_YEARS, sidx)

    # Remaining balance within current pada
    frac = _frac_in_pada(moon_lon)
    first_total = order_years[0]
    rem_years = (1.0 - frac) * first_total

    md_list = []
    cur_start = birth_utc

    # First (truncated) MD
    s, e = _span(cur_start, rem_years)
    md_list.append({
        "yogini": order_names[0],
        "lord":   YOG_LORDS[0 + sidx],
        "start":  s, "end": e
    })
    cur_start = e

    # Then cycle full Yoginī sequence repeatedly (36-year cycles)
    names_cyc = order_names[1:] + order_names
    lords_cyc = YOG_LORDS[1 + sidx:] + YOG_LORDS[:1 + sidx]
    years_cyc = order_years[1:] + order_years

    i = 0
    while (cur_start - birth_utc).days < int(180 * DAYS_PER_YEAR):
        nm = names_cyc[i % len(names_cyc)]
        ld = lords_cyc[i % len(lords_cyc)]
        yrs = years_cyc[i % len(years_cyc)]
        s, e = _span(cur_start, yrs)
        md_list.append({"yogini": nm, "lord": ld, "start": s, "end": e})
        cur_start = e
        i += 1

    return md_list


def _asht_start_index(moon_lon: float) -> int | None:
    """Return starting index in ASHT_LORDS from Janma-nakshatra lord, else None if not applicable."""
    from .nakshatra import get_nakshatra_lord
    lord = get_nakshatra_lord(moon_lon)
    if lord not in ASHT_ALLOWED_START:
        return None
    return ASHT_LORDS.index(lord)

def _build_asht_md_list(birth_utc: datetime, moon_lon: float) -> List[Dict]:
    """Build Aṣṭottarī MD list starting from Janma-nakshatra lord; first MD truncated by nak fraction."""
    sidx = _asht_start_index(moon_lon)
    if sidx is None:
        return []
    order = ASHT_LORDS[sidx:] + ASHT_LORDS[:sidx]
    order_years = ASHT_YEARS[sidx:] + ASHT_YEARS[:sidx]

    frac = _frac_in_nak(moon_lon)
    first_total = order_years[0]
    rem_years = (1.0 - frac) * first_total

    md_list = []
    cur = birth_utc
    s, e = _span(cur, rem_years)
    md_list.append({"lord": order[0], "start": s, "end": e})
    cur = e

    i = 0
    # build ~180 years horizon
    while (cur - birth_utc).days < int(180 * DAYS_PER_YEAR):
        lord = order[(i + 1) % len(order)]
        yrs  = order_years[(i + 1) % len(order_years)]
        s, e = _span(cur, yrs)
        md_list.append({"lord": lord, "start": s, "end": e})
        cur = e
        i += 1
    return md_list

def _kcd_group_for_nak(nak: str) -> str:
    """Map normalized nakshatra name to KCD group key."""
    # Tolerate minor spelling variants from nakshatra.py
    aliases = {
        "Ashvini":"Ashwini","Mrigasira":"Mrigashira","Vishaka":"Vishakha",
        "Uttara Ashada":"Uttara Ashadha","Purva Ashada":"Purva Ashadha",
        "Uttara Bhadra":"Uttara Bhadrapada","Purva Bhadra":"Purva Bhadrapada",
        "Shatataraka":"Shatabhisha","Sravana":"Shravana","Jyestha":"Jyeshtha",
        "Punarvasu":"Punarvasu","Pushyami":"Pushya","U Phalguni":"Uttara Phalguni",
        "P Phalguni":"Purva Phalguni","U Shadha":"Uttara Ashadha","P Shadha":"Purva Ashadha",
    }
    nak = aliases.get(nak, nak)
    return KCD_GROUP.get(nak)

def _kcd_end_and_restart_signs(group_key: str, deha: str, jeeva: str) -> tuple[str, str]:
    """
    Antardasa sequence rule (Saravali): proceed from MD lord up to the 'last' of the pada group,
    then continue from the 'first'. Last = Jeeva for Savya; Deha for Apsavya. First = the other.
    :contentReference[oaicite:2]{index=2}
    """
    is_savya = group_key.startswith("S")
    end_sign = jeeva if is_savya else deha
    restart_sign = deha if is_savya else jeeva
    return end_sign, restart_sign

def _kcd_ad_order(seq: list[str], md_sign: str, group_key: str, deha: str, jeeva: str, count: int = 8) -> list[str]:
    """Build Antardasa (or Pratyantara) order of 'count' signs."""
    n = len(seq)
    midx = seq.index(md_sign)
    end_sign, restart = _kcd_end_and_restart_signs(group_key, deha, jeeva)
    eidx = seq.index(end_sign)
    # walk from md_sign to end_sign (inclusive)
    block1 = []
    i = midx
    while True:
        block1.append(seq[i])
        if seq[i] == end_sign:
            break
        i = (i + 1) % n
    # then from restart onward
    block2 = []
    i = seq.index(restart)
    while len(block1) + len(block2) < count:
        block2.append(seq[i])
        i = (i + 1) % n
    out = (block1 + block2)[:count]
    return out

def _kcd_frac_in_pada(moon_lon: float) -> float:
    """Elapsed fraction within current pada (0..1)."""
    off_in_nak = (moon_lon % NAK_SIZE)
    off_in_pada = off_in_nak % (NAK_SIZE / 4.0)
    return off_in_pada / (NAK_SIZE / 4.0)

def compute_vimsottari(
    birth_dt_local: datetime,
    tz_hours: float,
    moon_lon: float,
    now_dt: Optional[datetime] = None
) -> Dict:
    """
    Returns:
    {
      "system": "Vimśottarī",
      "active": {
         "MD": {"lord","start","end"},
         "AD": {"lord","start","end"},
         "PD": {"lord","start","end"}
      },
      "timeline": {
         "MD": [ ...list of dicts... ],
         "AD_current": [ ...list of dicts under active MD... ],
         "PD_current": [ ...list under active AD... ]
      }
    }
    All datetimes are UTC ISO strings for safe templating.
    """
    birth_utc = _to_utc(birth_dt_local, tz_hours)
    if now_dt:
        now = now_dt.astimezone(timezone.utc) if now_dt.tzinfo else now_dt.replace(tzinfo=timezone.utc)
    else:
        now = datetime.now(timezone.utc)

    # MD timeline
    md_list = _build_md_list(birth_utc, moon_lon)

    # active MD
    md_active = next((md for md in md_list if _in_span(now, md["start"], md["end"])), md_list[0])

    # AD within active MD (subdivide by Vimśottarī sequence)
    ad_list = _subperiods(md_active, VIMS_LORDS, VIMS_YEARS)
    ad_active = next((ad for ad in ad_list if _in_span(now, ad["start"], ad["end"])), ad_list[0])

    # PD within active AD (again on same sequence)
    pd_list = _subperiods(ad_active, VIMS_LORDS, VIMS_YEARS)
    pd_active = next((pd for pd in pd_list if _in_span(now, pd["start"], pd["end"])), pd_list[0])

    def _iso(d: datetime) -> str:
        return d.astimezone(timezone.utc).isoformat()

    def _isoize(lst: List[Dict]) -> List[Dict]:
        return [{"lord": x["lord"], "start": _iso(x["start"]), "end": _iso(x["end"])} for x in lst]

    return {
        "system": "Vimśottarī",
        "active": {
            "MD": {"lord": md_active["lord"], "start": _iso(md_active["start"]), "end": _iso(md_active["end"])},
            "AD": {"lord": ad_active["lord"], "start": _iso(ad_active["start"]), "end": _iso(ad_active["end"])},
            "PD": {"lord": pd_active["lord"], "start": _iso(pd_active["start"]), "end": _iso(pd_active["end"])}
        },
        "timeline": {
            "MD": _isoize(md_list),
            "AD_current": _isoize(ad_list),
            "PD_current": _isoize(pd_list)
        }
    }

def compute_yogini(
    birth_dt_local: datetime,
    tz_hours: float,
    moon_lon: float,
    now_dt: Optional[datetime] = None
) -> Dict:
    """
    Yoginī (36-year) dashā:
    - Starting Yoginī set by Moon's nakshatra pada (1..4 ⇒ Mangala/Pingala/Dhanya/Bhramari).
    - First MD is truncated by the remaining fraction of the current pada.
    - AD/PD are proportional to the parent period using the same Yoginī order & durations.
    Returns shape parallel to Vimśottarī for easy templating.
    """
    birth_utc = _to_utc(birth_dt_local, tz_hours)
    if now_dt:
        now = now_dt.astimezone(timezone.utc) if now_dt.tzinfo else now_dt.replace(tzinfo=timezone.utc)
    else:
        now = datetime.now(timezone.utc)

    # MD timeline
    md_list = _build_yogini_md_list(birth_utc, moon_lon)

    # Active MD
    md_active = next((md for md in md_list if _in_span(now, md["start"], md["end"])), md_list[0])

    # AD under active MD (Yoginī order/durations)
    # Identify the Yoginī order relative to the active MD's Yoginī
    start_idx = YOG_NAMES.index(md_active["yogini"])
    ad_names, ad_years = _roll2(YOG_NAMES, YOG_YEARS, start_idx)
    ad_lords = YOG_LORDS[start_idx:] + YOG_LORDS[:start_idx]
    ad_list = _subperiods(
        {"start": md_active["start"], "end": md_active["end"]},
        ad_years=[y for y in ad_years],  # years only drive proportions
        lord_seq=[(nm, ld) for nm, ld in zip(ad_names, ad_lords)]
    ) if False else None  # placeholder to reuse generic function below

    # We want both name and lord; _subperiods currently only takes lords + years.
    # So build AD with a local routine mirroring _subperiods but keeping (name,lord).
    parent = md_active
    start, end = parent["start"], parent["end"]
    parent_days = (end - start).total_seconds() / 86400.0
    total_years = sum(ad_years)
    cur = start
    ad_list = []
    for nm, ld, yrs in zip(ad_names, ad_lords, ad_years):
        frac = yrs / total_years
        dur_days = parent_days * frac
        s = cur
        e = s + timedelta(days=dur_days)
        ad_list.append({"yogini": nm, "lord": ld, "start": s, "end": e})
        cur = e

    # PD under active AD (same order)
    pd_start_idx = YOG_NAMES.index(ad_list[0]["yogini"])  # start from same index as AD’s first
    pd_names, pd_years = _roll2(YOG_NAMES, YOG_YEARS, pd_start_idx)
    pd_lords = YOG_LORDS[pd_start_idx:] + YOG_LORDS[:pd_start_idx]

    # Active AD
    ad_active = next((ad for ad in ad_list if _in_span(now, ad["start"], ad["end"])), ad_list[0])

    # Build PDs under the active AD
    parent = ad_active
    start, end = parent["start"], parent["end"]
    parent_days = (end - start).total_seconds() / 86400.0
    total_years = sum(pd_years)
    cur = start
    pd_list = []
    for nm, ld, yrs in zip(pd_names, pd_lords, pd_years):
        frac = yrs / total_years
        dur_days = parent_days * frac
        s = cur
        e = s + timedelta(days=dur_days)
        pd_list.append({"yogini": nm, "lord": ld, "start": s, "end": e})
        cur = e

    def _iso(d: datetime) -> str:
        return d.astimezone(timezone.utc).isoformat()

    def _isoize(lst: List[Dict]) -> List[Dict]:
        return [{"yogini": x["yogini"], "lord": x["lord"], "start": _iso(x["start"]), "end": _iso(x["end"])} for x in lst]

    return {
        "system": "Yoginī",
        "active": {
            "MD": {"yogini": md_active["yogini"], "lord": md_active["lord"], "start": _iso(md_active["start"]), "end": _iso(md_active["end"])},
            "AD": {"yogini": ad_active["yogini"], "lord": ad_active["lord"], "start": _iso(ad_active["start"]), "end": _iso(ad_active["end"])},
            "PD": (lambda pd_a: {"yogini": pd_a["yogini"], "lord": pd_a["lord"], "start": _iso(pd_a["start"]), "end": _iso(pd_a["end"])})(
                next((pd for pd in pd_list if _in_span(now, pd["start"], pd["end"])), pd_list[0])
            ),
        },
        "timeline": {
            "MD": _isoize(md_list),
            "AD_current": _isoize(ad_list),
            "PD_current": _isoize(pd_list),
        }
    }

def compute_ashtottari(
    birth_dt_local: datetime,
    tz_hours: float,
    moon_lon: float,
    now_dt: Optional[datetime] = None
) -> Dict:
    """
    Aṣṭottarī (108-year) dashā:
    - Start from Janma-nakshatra lord (must be Sun/Moon/Mars/Jupiter).
    - First MD truncated by Moon's progress in its nakshatra.
    - AD/PD proportional using the same 8-lord order and years.
    """
    birth_utc = _to_utc(birth_dt_local, tz_hours)
    now = now_dt.astimezone(timezone.utc) if now_dt and now_dt.tzinfo else (now_dt.replace(tzinfo=timezone.utc) if now_dt else datetime.now(timezone.utc))

    md_list = _build_asht_md_list(birth_utc, moon_lon)
    if not md_list:
        return {
            "system": "Aṣṭottarī",
            "active": None,
            "timeline": None,
            "note": "Not applicable: Janma-nakshatra lord is not Sun/Moon/Mars/Jupiter."
        }

    md_active = next((md for md in md_list if _in_span(now, md["start"], md["end"])), md_list[0])
    ad_list = _subperiods(md_active, ASHT_LORDS, ASHT_YEARS)
    ad_active = next((ad for ad in ad_list if _in_span(now, ad["start"], ad["end"])), ad_list[0])
    pd_list = _subperiods(ad_active, ASHT_LORDS, ASHT_YEARS)
    pd_active = next((pd for pd in pd_list if _in_span(now, pd["start"], pd["end"])), pd_list[0])

    _iso = lambda d: d.astimezone(timezone.utc).isoformat()
    def _isoize(lst: List[Dict]) -> List[Dict]:
        return [{"lord": x["lord"], "start": _iso(x["start"]), "end": _iso(x["end"])} for x in lst]

    return {
        "system": "Aṣṭottarī",
        "active": {
            "MD": {"lord": md_active["lord"], "start": _iso(md_active["start"]), "end": _iso(md_active["end"])},
            "AD": {"lord": ad_active["lord"], "start": _iso(ad_active["start"]), "end": _iso(ad_active["end"])},
            "PD": {"lord": pd_active["lord"], "start": _iso(pd_active["start"]), "end": _iso(pd_active["end"])}
        },
        "timeline": {
            "MD": _isoize(md_list),
            "AD_current": _isoize(ad_list),
            "PD_current": _isoize(pd_list)
        },
        "note": "Kalacakra needs full pada→rāśi tables (savya/apasavya) to compute timelines; hook is wired for later.",
    }


# compute_kalachakra stub with full implementation
def compute_kalachakra(
    birth_dt_local: datetime,
    tz_hours: float,
    moon_lon: float,
    now_dt: Optional[datetime] = None
) -> Dict:
    """
    Full Kalacakra Dasha (Saravali method):
      - Choose Savya/Apsavya group by Janma-nakshatra; pick the row for the nakshatra's group.
      - Within that group, use the Moon's pada (1..4) to get the 9-sign MD sequence and Paramāyu.
      - Balance at birth: elapsed = Paramāyu * (fraction of pada elapsed). Walk over the 9-sign
        sequence to find the Mahadasha at birth; first MD duration = MD_years - elapsed_in_MD.
      - Antardasha: 8 subperiods; order is MD → ... → (end of group) then continue from (start of group).
        Duration of each AD = MD_duration * (Years_of_AD_sign / Paramāyu). Same logic for PD within AD.
      - All datetimes are UTC-aware ISO strings.
    References: Saravali “Kalachakra Dasa” chapters (Four Chakras, Balance at Birth, Antardasas, Cycles). :contentReference[oaicite:3]{index=3}
    """
    birth_utc = _to_utc(birth_dt_local, tz_hours)
    now = (now_dt.astimezone(timezone.utc) if (now_dt and now_dt.tzinfo) else
           (now_dt.replace(tzinfo=timezone.utc) if now_dt else datetime.now(timezone.utc)))

    # Identify nakshatra & pada
    nak = get_nakshatra_name(moon_lon)  # must match keys in KCD_GROUP (normalized by _kcd_group_for_nak)
    pada = get_pada(moon_lon)
    gkey = _kcd_group_for_nak(nak)
    if not gkey:
        return {"system":"Kalacakra","active":None,"timeline":None,
                "note": f"Unsupported nakshatra mapping for Kalacakra: {nak}"}

    row = KCD_TABLES[gkey][pada]
    seq = row["seq"][:]  # 9-sign MD sequence
    param = row["param"]
    deha = row["deha"]
    jeeva = row["jeeva"]

    # Balance at birth (elapsed portion within pada)
    frac = _kcd_frac_in_pada(moon_lon)
    elapsed_years = param * frac

    # Find MD at birth by subtracting sign years along the 9-sign sequence
    t = elapsed_years
    md_index = 0
    elapsed_in_md = 0.0
    for i, rasi in enumerate(seq):
        y = KCD_YEARS[rasi]
        if t > y:
            t -= y
            continue
        # birth is inside this MD
        md_index = i
        elapsed_in_md = t
        break

    # Build MD timeline (cover ~180y)
    md_list = []
    cur_start = birth_utc
    # first MD is the 'remainder' of the birth MD
    first_rasi = seq[md_index]
    first_total_years = KCD_YEARS[first_rasi]
    first_rem_years = max(first_total_years - elapsed_in_md, 0.0)
    s, e = _span(cur_start, first_rem_years)
    md_list.append({"rasi": first_rasi, "lord": KCD_SIGN_LORD[first_rasi], "start": s, "end": e})
    cur_start = e

    # subsequent MDs (wrap within the same pada sequence; see “Cyclic method”) :contentReference[oaicite:4]{index=4}
    i = (md_index + 1) % len(seq)
    while (cur_start - birth_utc).days < int(180 * DAYS_PER_YEAR):
        rasi = seq[i]
        yrs = KCD_YEARS[rasi]
        s, e = _span(cur_start, yrs)
        md_list.append({"rasi": rasi, "lord": KCD_SIGN_LORD[rasi], "start": s, "end": e})
        cur_start = e
        i = (i + 1) % len(seq)

    # Active MD now
    md_active = next((md for md in md_list if _in_span(now, md["start"], md["end"])), md_list[0])

    # Antardasha within active MD (8 parts; order based on group’s Jeeva/Deha rule) :contentReference[oaicite:5]{index=5}
    def _iso(d: datetime) -> str: return d.astimezone(timezone.utc).isoformat()
    md_days = (md_active["end"] - md_active["start"]).total_seconds() / 86400.0
    md_years = md_days / DAYS_PER_YEAR

    ad_order = _kcd_ad_order(seq, md_active["rasi"], gkey, deha, jeeva, count=8)
    ad_list = []
    cur = md_active["start"]
    for ad_rasi in ad_order:
        ad_years = (KCD_YEARS[ad_rasi] / param) * md_years
        s = cur
        e = s + timedelta(days=ad_years * DAYS_PER_YEAR)
        ad_list.append({"rasi": ad_rasi, "lord": KCD_SIGN_LORD[ad_rasi], "start": s, "end": e})
        cur = e

    ad_active = next((ad for ad in ad_list if _in_span(now, ad["start"], ad["end"])), ad_list[0])

    # Pratyantara within active AD (8 parts, same rule) :contentReference[oaicite:6]{index=6}
    ad_days = (ad_active["end"] - ad_active["start"]).total_seconds() / 86400.0
    ad_years = ad_days / DAYS_PER_YEAR
    pd_order = _kcd_ad_order(seq, ad_active["rasi"], gkey, deha, jeeva, count=8)
    pd_list = []
    cur = ad_active["start"]
    for pd_rasi in pd_order:
        pd_years = (KCD_YEARS[pd_rasi] / param) * ad_years
        s = cur
        e = s + timedelta(days=pd_years * DAYS_PER_YEAR)
        pd_list.append({"rasi": pd_rasi, "lord": KCD_SIGN_LORD[pd_rasi], "start": s, "end": e})
        cur = e

    pd_active = next((pd for pd in pd_list if _in_span(now, pd["start"], pd["end"])), pd_list[0])

    def _isoize(lst):
        return [{"rasi": x["rasi"], "lord": x["lord"], "start": _iso(x["start"]), "end": _iso(x["end"])} for x in lst]

    return {
        "system": "Kalacakra",
        "meta": {
            "nakshatra": nak,
            "pada": pada,
            "group": "Savya" if gkey.startswith("S") else "Apsavya",
            "paramayus": param,
            "deha": deha,
            "jeeva": jeeva,
            "sequence": seq
        },
        "active": {
            "MD": {"rasi": md_active["rasi"], "lord": md_active["lord"], "start": _iso(md_active["start"]), "end": _iso(md_active["end"])},
            "AD": {"rasi": ad_active["rasi"], "lord": ad_active["lord"], "start": _iso(ad_active["start"]), "end": _iso(ad_active["end"])},
            "PD": {"rasi": pd_active["rasi"], "lord": pd_active["lord"], "start": _iso(pd_active["start"]), "end": _iso(pd_active["end"])}
        },
        "timeline": {
            "MD": _isoize(md_list),
            "AD_current": _isoize(ad_list),
            "PD_current": _isoize(pd_list)
        }
    }

