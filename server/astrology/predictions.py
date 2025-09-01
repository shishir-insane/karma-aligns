# astrology/predictions.py
"""
Varahamihira-flavoured predictions engine for Sage Astro.

Principles:
- Primary reading by Bhāva Chalit (house placements) for popular-site parity.
- D9 refines relationships/spiritual themes; D10 confirms vocational themes.
- Multi-daśā blend: Vimśottarī, Yoginī, Aṣṭottarī, Kalacakra.
- Classical tone (Hora + Saṃhitā hints) with clear, modern buckets.

Inputs:
- planets: {"Sun":{"lon":deg,"retro":bool}, ...}  [sidereal D1]
- asc_idx: int (0..11) sidereal Lagna sign index (D1)
- chalit_houses: list[12] of lists (house 1..12 → planet names, full)
- vargas: {"D9":{"houses":[...12 lists...],"asc_idx":int}, "D10": {...}}
- dasha_info (optional): {
    "Vimshottari": {"active":{"MD":{"lord":...},"AD":{...},"PD":{...}}, ...},
    "Yogini":      {"active":{"MD":{"lord":...},"AD":{...},"PD":{...}}, ...},
    "Ashtottari":  {"active":{"MD":{"lord":...},"AD":{...},"PD":{...}}, ...},
    "Kalachakra":  {"active":{"MD":{"lord":...,"rasi":...}, ...}, ...}
  }

Output:
- dict[str, list[str]] with keys like:
  "Classical Reading", "Foundations", "Rhythm", "Top Priorities",
  "Career", "Wealth", "Relationships", "Health", "Learning/Spiritual"
"""

from collections import defaultdict
from typing import Dict, List, Optional

from .nakshatra import get_nakshatra_name, get_nakshatra_lord, nakshatra_for_lon
from .swe_utils import sign_index
from .symbols import SIGN_NAMES
from .yogas import detect_yogas

# --- Classical maps --------------------------------------------------------

SIGN_LORDS = {
    0: "Mars", 1: "Venus", 2: "Mercury", 3: "Moon", 4: "Sun", 5: "Mercury",
    6: "Venus", 7: "Mars", 8: "Jupiter", 9: "Saturn", 10: "Saturn", 11: "Jupiter"
}
NATURAL_BENEFICS = {"Jupiter", "Venus", "Mercury", "Moon"}
NATURAL_MALEFICS = {"Saturn", "Mars", "Rahu", "Ketu", "Sun"}  # Sun often taken as mild malefic

EXALT = {
    "Sun": "Aries", "Moon": "Taurus", "Mars": "Capricorn", "Mercury": "Virgo",
    "Jupiter": "Cancer", "Venus": "Pisces", "Saturn": "Libra"
}
DEBIL = {
    "Sun": "Libra", "Moon": "Scorpio", "Mars": "Cancer", "Mercury": "Pisces",
    "Jupiter": "Capricorn", "Venus": "Virgo", "Saturn": "Aries"
}

HOUSE_TOPICS = {
    1: "Self, vitality, identity",
    2: "Finances, speech, family",
    3: "Courage, siblings, communications",
    4: "Home, mother, property, inner peace",
    5: "Creativity, children, education, romance",
    6: "Work, service, health, conflicts",
    7: "Partnerships, marriage, contracts",
    8: "Transformations, sudden events, shared resources",
    9: "Dharma, fortune, higher learning, travel",
    10:"Career, status, authority, reputation",
    11:"Income, networks, gains, ambitions",
    12:"Losses, sleep, foreign lands, liberation",
}

PLANET_HOUSE_HINTS = {
    "Jupiter": {
        1:"Wisdom shapes identity; teaching/mentorship prosper.",
        2:"Ethical earnings, learning-led finances.",
        5:"Fertile creativity; study and progeny favoured.",
        9:"Grace through teachers and pilgrimage.",
        10:"Growth in status via counsel and learning.",
        11:"Networks yield gains through generosity."
    },
    "Saturn": {
        1:"Grave responsibilities; steady self-mastery.",
        6:"Persistence overcomes toil; strengthen routines.",
        7:"Partnerships tested; vows need patience.",
        10:"Slow, lasting recognition; respect through duty.",
        11:"Gains mature slowly; durable alliances."
    },
    "Mars": {
        3:"Valor in speech; channel sharpness.",
        6:"Competitive edge at work; avoid burnout.",
        10:"Initiative in vocation; command through action."
    },
    "Venus": {
        4:"Harmony at home; beauty and comfort matter.",
        5:"Romance and arts blossom.",
        7:"Sweetness in bonds; negotiate fairly.",
        10:"Public charm; creative profession thrives.",
        11:"Friends and patrons assist gains."
    },
    "Mercury": {
        3:"Writing/sales commute well; short learning spikes.",
        5:"Intellectual play; teaching children/peers.",
        7:"Contracts thrive on clarity; commerce benefits.",
        10:"Analytic reputation; speak to lead.",
        11:"Community grows via ideas and content."
    },
    "Moon": {
        4:"Inner life and home take centre stage.",
        5:"Nurturing creativity; mind playful.",
        10:"Reputation follows moods—govern rhythm."
    },
    "Sun": {
        1:"Leadership presence; refine ego with dharma.",
        5:"Creative spotlight seeks responsibility.",
        10:"Authority themes—let values be visible."
    },
    "Rahu": {
        3:"Amplified communications; ethics prevent overreach.",
        7:"Unusual partners; firm terms prevent fog.",
        10:"Leaps in career; verify risks and optics.",
        11:"Explosive networks; gatekeep for quality."
    },
    "Ketu": {
        4:"Detachment at home; inner work ripens.",
        7:"Karmic bonds; spiritualize expectations.",
        10:"Redefine success; let go of stale status.",
        12:"Mystical lean; guard against withdrawal."
    }
}

# Multi-daśā blend weights (tunable; sum not required)
SYS_SHORT  = {"Vimshottari": "Vimś", "Yogini": "Yog", "Ashtottari": "Aṣṭ", "Kalachakra": "Kāl"}
SYS_WEIGHT = {"Vimshottari": 1.00,   "Kalachakra": 0.90, "Ashtottari": 0.85, "Yogini": 0.80}

# --- helpers ---------------------------------------------------------------

def _house_of(planet_name: str, chalit_houses: List[List[str]]) -> Optional[int]:
    """Return 1..12 if planet is found in the house lists; else None."""
    for i, plist in enumerate(chalit_houses, start=1):
        if planet_name in plist:
            return i
    return None

def _varga_presence(vargas: Dict, key: str, house_num: int, planet_name: str) -> bool:
    try:
        houses = vargas.get(key, {}).get("houses", [])
        return planet_name in houses[house_num - 1]
    except Exception:
        return False

def _sign_name(lon_deg: float) -> str:
    return SIGN_NAMES[sign_index(lon_deg)]

def _dignity(planet: str, sign: str) -> str:
    if sign == EXALT.get(planet): return "exalted"
    if sign == DEBIL.get(planet): return "debilitated"
    lord = SIGN_LORDS[SIGN_NAMES.index(sign)]
    if lord == planet: return "in own sign"
    return "neutral"

def _lagna_lord(asc_idx: int) -> str:
    return SIGN_LORDS[asc_idx]

def _append_unique(bucket: List[str], msg: str, to_front: bool = False) -> None:
    if msg and msg not in bucket:
        if to_front:
            bucket.insert(0, msg)
        else:
            bucket.append(msg)

def _amplify(text: str, add: str) -> str:
    if add and add not in text:
        return f"{text} {add}"
    return text

# --- main engine -----------------------------------------------------------

def generate_predictions(
    planets: Dict[str, Dict[str, float]],
    asc_idx: int,
    chalit_houses: List[List[str]],
    vargas: Dict,
    dasha_info: Optional[Dict] = None,
    strengths: Optional[Dict] = None
) -> Dict[str, List[str]]:
    out: Dict[str, List[str]] = defaultdict(list)

    # Context: Lagna & Moon
    lagna_sign = SIGN_NAMES[asc_idx]
    lagna_lord = _lagna_lord(asc_idx)
    lagna_lord_house = _house_of(lagna_lord, chalit_houses)

    moon = planets.get("Moon")
    moon_sign = _sign_name(moon["lon"]) if moon else None
    moon_nak, moon_nak_lord, moon_pada = nakshatra_for_lon(moon["lon"]) if moon else (None, None, None)

    # 1) Planet-by-house reading (Bhāva Chalit) with dignity + varga seasoning
    for pname, pdata in planets.items():
        if pname == "Ketu":  # keep Rahu/Ketu distinct; Ketu hints are defined separately
            pass
        h = _house_of(pname, chalit_houses)
        if not h:
            continue

        sign_here = _sign_name(pdata["lon"])
        qual = _dignity(pname, sign_here)

        # Base snippet
        if pname in PLANET_HOUSE_HINTS and h in PLANET_HOUSE_HINTS[pname]:
            text = PLANET_HOUSE_HINTS[pname][h]
        else:
            topic = HOUSE_TOPICS.get(h, "general matters")
            if pname in NATURAL_BENEFICS:
                text = f"{pname} in house {h} supports {topic.lower()}."
            else:
                text = f"{pname} in house {h} tests {topic.lower()} yet yields growth through restraint."

        # Dignity
        if qual != "neutral":
            text = _amplify(text, f"({pname} is {qual} in {sign_here}).")

        # D9 partnership emphasis
        if _varga_presence(vargas, "D9", 7, pname):
            text = _amplify(text, "D9 stresses partnership karma—temper expectations with empathy.")

        # D10 career emphasis
        if _varga_presence(vargas, "D10", 10, pname):
            text = _amplify(text, "D10 confirms vocational outcomes—make this visible at work.")

        # Bucket
        if h in (10, 6):
            _append_unique(out["Career"], text)
        if h in (2, 11):
            _append_unique(out["Wealth"], text)
        if h in (7, 5, 4):
            _append_unique(out["Relationships"], text)
        if h in (6, 8, 12):
            _append_unique(out["Health"], text)
        if h in (9, 5, 12):
            _append_unique(out["Learning/Spiritual"], text)

    # 2) Foundations & Rhythm
    if lagna_lord_house:
        _append_unique(
            out["Foundations"],
            f"Lagna in {lagna_sign}; its lord {lagna_lord} occupies house {lagna_lord_house}, colouring life themes accordingly."
        )
    if moon:
        _append_unique(
            out["Rhythm"],
            f"Mind attunes to {moon_sign}; Moon in {moon_nak} (pada {moon_pada}, lord {moon_nak_lord}) sets the emotional cadence and daily priorities."
        )

    # +ADD Yoga Detection (instant Wow factor)
    yres = detect_yogas(planets, asc_idx)
    if yres:
        # Summary bucket
        if yres.get("highlights"):
            out["Yogas"] = yres["highlights"]

        # Route to relevant categories (prepend for emphasis)
        yc = yres.get("by_category", {})
        for cat_key in ("Career","Wealth","Relationships","Foundations","Learning/Spiritual"):
            for line in yc.get(cat_key, []):
                if line not in out[cat_key]:
                    out[cat_key].insert(0, line)


    # 3) Multi-daśā emphasis: blend MD (and summarize AD) across systems
    by_lord: Dict[str, float] = defaultdict(float)
    systems_by_lord: Dict[str, List[str]] = defaultdict(list)
    ad_focus_bits: List[str] = []

    if dasha_info:
        for sys in ("Vimshottari", "Yogini", "Ashtottari", "Kalachakra"):
            sdata = dasha_info.get(sys)
            if not sdata or not sdata.get("active"):
                continue
            act = sdata["active"]
            # MD lord → weighted vote
            md_lord = (act.get("MD") or {}).get("lord")
            if md_lord:
                w = SYS_WEIGHT.get(sys, 0.5)
                by_lord[md_lord] += w
                tag = SYS_SHORT.get(sys, sys)
                if tag not in systems_by_lord[md_lord]:
                    systems_by_lord[md_lord].append(tag)
            # AD short hint
            ad_lord = (act.get("AD") or {}).get("lord")
            if ad_lord:
                h2 = _house_of(ad_lord, chalit_houses)
                if h2:
                    ad_focus_bits.append(f"{SYS_SHORT.get(sys, sys)} AD: {ad_lord}→H{h2}")

    # Insert MD emphasis into buckets (highest-weighted first)
    for lord, score in sorted(by_lord.items(), key=lambda x: x[1], reverse=True):
        h = _house_of(lord, chalit_houses)
        if not h:
            continue
        tag = "/".join(systems_by_lord[lord])
        msg = f"Mahādaśā emphasis ({tag}): {lord} → house {h} ({HOUSE_TOPICS.get(h, 'key life area').lower()})."
        if h in (10, 6):
            _append_unique(out["Career"], msg, to_front=True)
        if h in (2, 11):
            _append_unique(out["Wealth"], msg, to_front=True)
        if h in (7, 5, 4):
            _append_unique(out["Relationships"], msg, to_front=True)
        if h in (6, 8, 12):
            _append_unique(out["Health"], msg, to_front=True)
        if h in (9, 5, 12):
            _append_unique(out["Learning/Spiritual"], msg, to_front=True)

    top_strengths = []
    try:
        if strengths and "total" in strengths:
            items = list(strengths["total"].items())
            items.sort(key=lambda kv: kv[1], reverse=True)
            top_strengths = [f"{k} ({int(v*100)}%)" for k, v in items[:3]]
    except Exception:
        top_strengths = []
    if top_strengths:
        out["Top Priorities"].insert(0, "Strong influences (Śaḍbala): " + ", ".join(top_strengths))


    # 4) Top Priorities
    priorities = []
    if any(_house_of(p, chalit_houses) == 10 for p in ("Sun", "Saturn", "Jupiter", "Mars", "Rahu")):
        priorities.append("Career visibility & structure")
    if any(_house_of(p, chalit_houses) == 7 for p in ("Venus", "Jupiter", "Rahu", "Saturn")):
        priorities.append("Partnership agreements & expectations")
    if any(_house_of(p, chalit_houses) == 6 for p in ("Saturn", "Mars", "Rahu")):
        priorities.append("Health routines & workload pacing")
    if ad_focus_bits:
        priorities.insert(0, "Sub-period focus — " + "; ".join(ad_focus_bits[:3]))
    if priorities:
        out["Top Priorities"] = priorities

    # 5) Classical Reading (compact, Varāhamihira tone)
    classical_lines = []
    classical_lines.append(
        f"In the nativity with {lagna_sign} rising, with the lord {lagna_lord} placed in "
        f"house {lagna_lord_house if lagna_lord_house else 'its own sphere'}, the tenor of life is thus shaped."
    )
    if moon:
        classical_lines.append(
            f"The Moon’s course in {moon_sign}, lodged in {moon_nak} (pada {moon_pada}), "
            f"under {moon_nak_lord}’s governance, declares the mind’s tide."
        )
    # strongest dashā steering
    top_lord, top_house = None, None
    if by_lord:
        top_lord = max(by_lord.items(), key=lambda x: x[1])[0]
        top_house = _house_of(top_lord, chalit_houses)
        if top_lord and top_house:
            classical_lines.append(f"Dashā sway chiefly of {top_lord}; matters of house {top_house} take precedence.")
    
    if not top_lord and strengths and "total" in strengths and strengths["total"]:
        best = max(strengths["total"].items(), key=lambda kv: kv[1])[0]
        hbest = _house_of(best, chalit_houses)
        if hbest:
            classical_lines.append(f"Notably potent is {best}; house {hbest} themes show pronounced agency.")


    # stitch 1 line from key buckets to keep it sutra-like
    def pick(cat): return out.get(cat, [])[:1]
    sutra = pick("Career") + pick("Relationships") + pick("Wealth")
    if sutra:
        classical_lines.append(" ".join(sutra))

    # Optional classical mention of a notable yoga
    if yres and yres.get("highlights"):
        classical_lines.append(f"Notable yoga: {yres['highlights'][0]}")


    classical_lines.append(
        "Let duties be embraced with measure; where benefics aspect, cultivate; "
        "where malefics press, fortify by discipline. Thus the native prospers."
    )

    out["Classical Reading"] = [" ".join(classical_lines)]
    return dict(out)
