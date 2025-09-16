from __future__ import annotations
from typing import Dict, List, Tuple, Optional, Any
from .swe_utils import sign_index
from .symbols import SIGN_NAMES

# ---- constants ------------------------------------------------------------
PLANETS = ["Sun","Moon","Mars","Mercury","Jupiter","Venus","Saturn","Rahu","Ketu"]

# Naisargika Bala (fixed, classic shastiāṁśa scale; mapped to 0..1 by /60)
NAISARGIKA_SS = {"Sun":60,"Moon":51,"Venus":43,"Jupiter":34,"Mercury":26,"Mars":17,"Saturn":9,"Rahu":15,"Ketu":15}

EXALT = {"Sun":"Aries","Moon":"Taurus","Mars":"Capricorn","Mercury":"Virgo","Jupiter":"Cancer","Venus":"Pisces","Saturn":"Libra"}
DEBIL = {"Sun":"Libra","Moon":"Scorpio","Mars":"Cancer","Mercury":"Pisces","Jupiter":"Capricorn","Venus":"Virgo","Saturn":"Aries"}

# Permanent friendships (Parāśara; simplified)
FRIENDS = {
    "Sun":{"Moon","Mars","Jupiter"}, "Moon":{"Sun","Mercury"},
    "Mars":{"Sun","Moon","Jupiter"}, "Mercury":{"Sun","Venus"},
    "Jupiter":{"Sun","Moon","Mars"}, "Venus":{"Mercury","Saturn"},
    "Saturn":{"Mercury","Venus"},
}
ENEMIES = {
    "Sun":{"Venus","Saturn"}, "Moon":set(), "Mars":{"Mercury"},
    "Mercury":{"Moon"}, "Jupiter":{"Venus","Mercury"}, "Venus":{"Sun","Moon"}, "Saturn":{"Sun","Moon"},
}

# Digbala ideal houses (1..12)
DIGBALA_IDEAL = {
    "Sun":10, "Mars":10,
    "Jupiter":1, "Mercury":1,
    "Saturn":7,
    "Moon":4, "Venus":4,
    "Rahu":10, "Ketu":4,  # pragmatic choices for nodes
}

# Day/Night leaning
DAY_PLANETS = {"Sun","Jupiter","Saturn"}
NIGHT_PLANETS = {"Moon","Venus","Mars"}
# Mercury neutral

BENEFICS = {"Jupiter","Venus","Mercury","Moon"}
MALEFICS = {"Saturn","Mars","Rahu","Ketu","Sun"}

# Weights (sum ≈ 1.0); tunable
W = {"naisargika":0.20, "sthana":0.25, "dig":0.15, "kala":0.15, "cheshta":0.15, "drik":0.10}

# Commonly referenced (capped) maxima for each bala component in VIRUPAS.
DEFAULT_COMPONENT_MAX_VIRUPA: Dict[str, int] = {
    "sthana": 228,    # Sthana Bala
    "dig": 60,        # Dig Bala
    "kala": 225,      # Kala Bala
    "cheshta": 60,    # Cheshta Bala
    "drik": 90,       # Drik Bala (cap)
    # "naisargika" handled per-planet below
}

# Naisargika Bala maxima per planet in VIRUPAS (classical table; Rahu/Ketu configurable)
DEFAULT_NAISARGIKA_MAX_VIRUPA: Dict[str, int] = {
    "Sun": 60, "Moon": 51, "Venus": 43, "Jupiter": 34,
    "Mercury": 26, "Mars": 17, "Saturn": 9,
    "Rahu": 30, "Ketu": 30,
}

# DEFAULT_NAISARGIKA_MAX_VIRUPA.update({"Rahu": 0, "Ketu": 0})

# ---- helpers --------------------------------------------------------------
def _sign_name(lon: float) -> str:
    return SIGN_NAMES[sign_index(lon)]

def _house_of(name: str, chalit_houses: List[List[str]]) -> Optional[int]:
    for i, plist in enumerate(chalit_houses, start=1):
        if name in plist:
            return i
    return None

def _sign_diff(a: int, b: int) -> int:
    return (b - a) % 12

def _q_aspects_p(q_name: str, q_sign: int, p_sign: int) -> bool:
    d = _sign_diff(q_sign, p_sign)
    if d == 6:  # 7th
        return True
    if q_name == "Mars" and d in (3,7):      # 4,8
        return True
    if q_name == "Jupiter" and d in (4,8):   # 5,9
        return True
    if q_name == "Saturn" and d in (2,9):    # 3,10
        return True
    return False

def _friend_level(planet: str, sign_name: str) -> str:
    lord = _lord_of_sign(sign_name)
    if lord == planet: return "own"
    if sign_name == EXALT.get(planet): return "exalt"
    if sign_name == DEBIL.get(planet): return "debil"
    if lord in FRIENDS.get(planet,set()): return "friend"
    if lord in ENEMIES.get(planet,set()): return "enemy"
    return "neutral"

def _lord_of_sign(sign_name: str) -> str:
    idx = SIGN_NAMES.index(sign_name)
    SIGN_LORDS = {
        0: "Mars", 1: "Venus", 2: "Mercury", 3: "Moon", 4: "Sun", 5: "Mercury",
        6: "Venus", 7: "Mars", 8: "Jupiter", 9: "Saturn", 10:"Saturn", 11:"Jupiter"
    }
    return SIGN_LORDS[idx]

# ---- components -----------------------------------------------------------
def _naisargika(planet: str) -> float:
    return max(0.0, min(1.0, NAISARGIKA_SS.get(planet, 20)/60.0))

def _sthana(planet: str, sign_name: str) -> float:
    lvl = _friend_level(planet, sign_name)
    return {
        "exalt":1.00, "own":0.75, "friend":0.60, "neutral":0.50, "enemy":0.40, "debil":0.25
    }.get(lvl, 0.50)

def _digbala(planet: str, house_num: Optional[int]) -> float:
    if not house_num: return 0.5
    ideal = DIGBALA_IDEAL.get(planet)
    if not ideal: return 0.5
    dist = min((_house_dist(house_num, ideal)), 12 - _house_dist(house_num, ideal))
    # full at ideal (dist 0), ~0 at opposite (dist ≥ 6)
    return max(0.0, 1.0 - (dist/6.0))

def _house_dist(a: int, b: int) -> int:
    return (b - a) % 12

def _kalabala(planet: str, local_hour: Optional[int]) -> float:
    if local_hour is None: return 0.6
    is_day = 6 <= local_hour < 18
    if planet in DAY_PLANETS: return 1.0 if is_day else 0.5
    if planet in NIGHT_PLANETS: return 1.0 if not is_day else 0.5
    return 0.75  # Mercury neutral

def _cheshta(planet: str, retro: Optional[bool]) -> float:
    if planet in ("Sun","Moon"): return 0.5
    return 1.0 if retro else 0.55

def _drikbala(planet: str, planets: Dict[str, Dict]) -> float:
    """Sign-based: benefic aspects add, malefic subtract; map −5..+5 → 0..1."""
    si = {p: sign_index(d["lon"]) for p, d in planets.items() if "lon" in d}
    if planet not in si: return 0.5
    ps = si[planet]
    score = 0
    for q, qs in si.items():
        if q == planet: continue
        if _q_aspects_p(q, qs, ps):
            score += 1 if q in BENEFICS else -1
    # map to 0..1
    score = max(-5, min(5, score))
    return (score + 5)/10.0

def _virupa_to_rupa(virupa: float) -> float:
    """Convert Virupa to Rupa (1 Rupa = 60 Virupas)."""
    return virupa / 60.0

def _component_max_virupa(planet: str, component: str,
                          overrides: Optional[Dict[str, Any]] = None) -> int:
    """Get max virupa for a given component (planet-specific for naisargika)."""
    overrides = overrides or {}
    if component == "naisargika":
        tbl = {**DEFAULT_NAISARGIKA_MAX_VIRUPA, **overrides.get("naisargika_max", {})}
        return int(tbl.get(planet, 30))
    per_component = overrides.get("component_max", {})
    return int(per_component.get(component, DEFAULT_COMPONENT_MAX_VIRUPA.get(component, 60)))

def convert_components_to_virupa(components: Dict[str, float], planet: str,
                                 overrides: Optional[Dict[str, Any]] = None
                                ) -> Tuple[Dict[str, float], float]:
    """
    Convert a planet's normalized 0..1 component fractions into VIRUPA contributions,
    using component-specific maxima. Returns (per_component_virupa, total_virupa).
    """
    virupas = {}
    total = 0.0
    for comp, frac in components.items():
        max_v = _component_max_virupa(planet, comp, overrides)
        f = min(max(frac, 0.0), 1.0)
        v = f * max_v
        virupas[comp] = v
        total += v
    return virupas, total

def convert_shadbala_to_rupas(data: Dict[str, Any],
                              overrides: Optional[Dict[str, Any]] = None
                             ) -> Dict[str, Any]:
    """
    Input:
      {
        "components": {
           "Planet": {"sthana": 0..1, "dig": 0..1, "kala": 0..1,
                      "cheshta": 0..1, "drik": 0..1, "naisargika": 0..1},
           ...
        }
      }
    Output:
      {
        "planets": {
          "Planet": {
            "components": {"virupa": {...}, "rupa": {...}},
            "totals": {"virupa": X, "rupa": Y}
          }, ...
        },
        "summary": {"ranking_by_rupa": [("Planet", rupa_total), ...]}
      }
    """
    components: Dict[str, Dict[str, float]] = data.get("components", {})
    result = {"planets": {}, "summary": {}}
    ranking = []

    for planet, comp_map in components.items():
        virupa_map, total_virupa = convert_components_to_virupa(comp_map, planet, overrides)
        rupa_map = {k: _virupa_to_rupa(v) for k, v in virupa_map.items()}
        total_rupa = _virupa_to_rupa(total_virupa)

        result["planets"][planet] = {
            "components": {"virupa": virupa_map, "rupa": rupa_map},
            "totals": {"virupa": total_virupa, "rupa": total_rupa},
        }
        ranking.append((planet, total_rupa))

    ranking.sort(key=lambda x: x[1], reverse=True)
    result["summary"]["ranking_by_rupa"] = ranking
    return result

def strength_tier_from_rupa(rupa: float) -> str:
    if rupa >= 150:
        return "very strong (150+ Rupas)"
    if rupa >= 100:
        return "strong (100–149 Rupas)"
    if rupa >= 60:
        return "functional (60–99 Rupas)"
    return "weak (<60 Rupas)"


# ---- main ----------------------------------------------------------------
def _compute_shadbala_normalized(
    planets: Dict[str, Dict],
    asc_idx: int,
    chalit_houses: List[List[str]],
    *, local_hour: Optional[int] = None
) -> Dict[str, Dict]:
    """
    Returns:
      {
        "total": {"Sun":0.78, ...},               # 0..1
        "components": {"Sun": {"naisargika":..., "sthana":..., "dig":..., "kala":..., "cheshta":..., "drik":...}, ...}
      }
    """
    total: Dict[str, float] = {}
    comps: Dict[str, Dict[str, float]] = {}

    for p in PLANETS:
        d = planets.get(p)
        if not d or "lon" not in d: 
            continue
        sign = _sign_name(d["lon"])
        hnum = _house_of(p, chalit_houses)
        c_na = _naisargika(p)
        c_st = _sthana(p, sign)
        c_di = _digbala(p, hnum)
        c_ka = _kalabala(p, local_hour)
        c_ch = _cheshta(p, d.get("retro"))
        c_dr = _drikbala(p, planets)

        comps[p] = {"naisargika":c_na, "sthana":c_st, "dig":c_di, "kala":c_ka, "cheshta":c_ch, "drik":c_dr}
        val = sum(comps[p][k]*W[k] for k in W.keys())
        total[p] = max(0.0, min(1.0, val))

    return {"total": total, "components": comps}

def compute_shadbala(
    *args,
    return_scale: str = "both",      # "normalized" | "rupas" | "both"
    overrides: Optional[Dict[str, Any]] = None,
    **kwargs
) -> dict:
    """
    Computes Shadbala and returns either:
      - normalized (0..1) only,
      - classical Virupa/Rupa only,
      - both (default).

    'overrides' can adjust maxima (component and naisargika) if you want a different table.
    """
    # 1) Get your existing normalized output
    normalized = _compute_shadbala_normalized(*args, **kwargs)

    if return_scale == "normalized":
        return normalized

    # 2) Convert normalized components -> Virupa/Rupa
    # Expecting normalized["components"] to be {planet: {component: fraction}}
    comp = {"components": normalized["components"]}
    converted = convert_shadbala_to_rupas(comp, overrides=overrides)

    # 3) Build classical totals
    rupa_totals   = {p: converted["planets"][p]["totals"]["rupa"]   for p in converted["planets"]}
    virupa_totals = {p: converted["planets"][p]["totals"]["virupa"] for p in converted["planets"]}
    tiers         = {p: strength_tier_from_rupa(rupa_totals[p])     for p in converted["planets"]}

    if return_scale == "rupas":
        return {
            "components": converted["planets"],   # includes per-component virupa & rupa
            "totals": {
                "virupa": virupa_totals,
                "rupa": rupa_totals,
                "tier": tiers,
            },
            "summary": converted["summary"],       # ranking_by_rupa
        }

    # 4) Default: return BOTH (normalized + classical), keeping your legacy totals intact
    return {
        "components": {
            "normalized": normalized["components"],    # same as today
            "virupa_rupa": converted["planets"],       # per-component virupa & rupa
        },
        "totals": {
            "normalized": normalized.get("total") or normalized.get("totals"),
            "virupa": virupa_totals,
            "rupa": rupa_totals,
            "tier": tiers,
        },
        "summary": converted["summary"],
    }

