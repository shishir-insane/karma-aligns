from typing import Dict, List, Tuple, Optional, Set
from .swe_utils import sign_index
from .symbols import SIGN_NAMES

# Keep these maps in sync with predictions.py
SIGN_LORDS = {
    0: "Mars", 1: "Venus", 2: "Mercury", 3: "Moon", 4: "Sun", 5: "Mercury",
    6: "Venus", 7: "Mars", 8: "Jupiter", 9: "Saturn", 10: "Saturn", 11: "Jupiter"
}
EXALT = {
    "Sun": "Aries", "Moon": "Taurus", "Mars": "Capricorn", "Mercury": "Virgo",
    "Jupiter": "Cancer", "Venus": "Pisces", "Saturn": "Libra"
}
DEBIL = {
    "Sun": "Libra", "Moon": "Scorpio", "Mars": "Cancer", "Mercury": "Pisces",
    "Jupiter": "Capricorn", "Venus": "Virgo", "Saturn": "Aries"
}
BENEFICS = {"Jupiter","Venus","Mercury","Moon"}
CLASSICALS = ["Sun","Moon","Mars","Mercury","Jupiter","Venus","Saturn"]

def _planet_sign_idx(planets: Dict[str, Dict]) -> Dict[str, int]:
    return {p: sign_index(d["lon"]) for p, d in planets.items() if "lon" in d}

def _planet_house_rashi(planets: Dict[str, Dict], asc_idx: int) -> Dict[str, int]:
    si = _planet_sign_idx(planets)
    return {p: ((s - asc_idx) % 12) + 1 for p, s in si.items()}

def _house_sign_idx(asc_idx: int, house: int) -> int:
    return (asc_idx + (house - 1)) % 12

def _house_lords(asc_idx: int) -> Dict[int, str]:
    # 1..12 → lord name
    return {h: SIGN_LORDS[_house_sign_idx(asc_idx, h)] for h in range(1, 13)}

def _same_sign(s1: int, s2: int) -> bool:
    return s1 == s2

def _sign_diff(s1: int, s2: int) -> int:
    return (s2 - s1) % 12  # 0..11 forward distance

def _mutual_aspect_by_sign(p1: str, s1: int, p2: str, s2: int) -> bool:
    """Graha dṛṣṭi by sign: all planets aspect 7th; Mars (4,8), Jupiter (5,9), Saturn (3,10)."""
    d = _sign_diff(s1, s2)
    d2 = _sign_diff(s2, s1)

    if d == 6 or d2 == 6:
        return True
    special = {
        "Mars": {3, 7},       # 4th, 8th
        "Jupiter": {4, 8},    # 5th, 9th
        "Saturn": {2, 9},     # 3rd, 10th
    }
    if p1 in special and d in special[p1]:
        return True
    if p2 in special and d2 in special[p2]:
        return True
    return False

def _is_kendra(h: int) -> bool:
    return h in (1,4,7,10)

def _own_sign(planet: str, sign_idx_: int) -> bool:
    return SIGN_LORDS[sign_idx_] == planet

def _exalted(planet: str, sign_idx_: int) -> bool:
    return SIGN_NAMES[sign_idx_] == EXALT.get(planet)

def _debilitated(planet: str, sign_idx_: int) -> bool:
    return SIGN_NAMES[sign_idx_] == DEBIL.get(planet)

def _parivartana(si: Dict[str, int]) -> List[Tuple[str, str]]:
    """Detect simple sign exchange between two classical planets."""
    out = []
    for a in CLASSICALS:
        for b in CLASSICALS:
            if a >= b:  # avoid dup/self
                continue
            if a not in si or b not in si:
                continue
            sign_a = si[a]
            sign_b = si[b]
            if SIGN_LORDS[sign_a] == b and SIGN_LORDS[sign_b] == a:
                out.append((a, b))
    return out

def detect_yogas(
    planets: Dict[str, Dict],
    asc_idx: int
) -> Dict[str, List[str]]:
    """
    Returns:
      {
        "highlights": [str, ...],             # one-liners
        "by_category": {"Wealth":[...], ...}  # suggested buckets
      }
    """
    hi: List[str] = []
    cat: Dict[str, List[str]] = {"Wealth": [], "Career": [], "Relationships": [], "Foundations": [], "Learning/Spiritual": []}

    si = _planet_sign_idx(planets)
    hi_r = _planet_house_rashi(planets, asc_idx)
    lords = _house_lords(asc_idx)

    # --- 1) Rāja Yogas: Kendra × Trikona lords in yuti/aspect
    kendras = [1,4,7,10]
    trikonas = [1,5,9]
    seen: Set[Tuple[str,str]] = set()
    for k in kendras:
        for t in trikonas:
            lk = lords[k]; lt = lords[t]
            if lk not in si or lt not in si:
                continue
            sk, st = si[lk], si[lt]
            if _same_sign(sk, st) or _mutual_aspect_by_sign(lk, sk, lt, st):
                key = tuple(sorted((lk, lt)))
                if key in seen:
                    continue
                seen.add(key)
                msg = f"Rājayoga: {lk} (kendra-lord) with {lt} (trikona-lord) by association—status and support rise."
                hi.append(msg); cat["Career"].append(msg); cat["Foundations"].append(msg)

    # --- 2) Dhanayogas: 2nd/11th lords linked with 1/2/5/9/11 lords
    wealth_lords = [lords[2], lords[11]]
    partners = [lords[i] for i in (1,2,5,9,11)]
    seen = set()
    for wlord in wealth_lords:
        if wlord not in si: continue
        sw = si[wlord]
        for plord in partners:
            if plord not in si: continue
            sp = si[plord]
            if _same_sign(sw, sp) or _mutual_aspect_by_sign(wlord, sw, plord, sp):
                key = tuple(sorted((wlord, plord)))
                if key in seen: continue
                seen.add(key)
                msg = f"Dhanayoga: {wlord} connected with {plord}—income/accumulation favored."
                hi.append(msg); cat["Wealth"].append(msg)

    # Benefics occupying 2 or 11
    for p in BENEFICS:
        if p in hi_r and hi_r[p] in (2,11):
            msg = f"{p} in house {hi_r[p]} supports earnings and gains."
            hi.append(msg); cat["Wealth"].append(msg)

    # --- 3) Chandra–Maṅgala: Moon ↔ Mars yuti or mutual aspect
    if "Moon" in si and "Mars" in si:
        sm, sM = si["Moon"], si["Mars"]
        if _same_sign(sm, sM) or _mutual_aspect_by_sign("Moon", sm, "Mars", sM):
            msg = "Chandra–Maṅgala Yoga: Moon with Mars—enterprise and cashflow potential (manage volatility)."
            hi.append(msg); cat["Wealth"].append(msg); cat["Career"].append(msg)

    # --- 4) Gaja–Keśarī: Jupiter in kendra from Moon (0/4/7/10 signs away)
    if "Moon" in si and "Jupiter" in si:
        d = _sign_diff(si["Moon"], si["Jupiter"])
        if d in (0,3,6,9):
            msg = "Gaja–Keśarī Yoga: Moon–Jupiter kendra relation—popularity, counsel, protection."
            hi.append(msg); cat["Foundations"].append(msg); cat["Learning/Spiritual"].append(msg)

    # --- 5) Budha–Āditya: Sun + Mercury yuti
    if "Sun" in si and "Mercury" in si and _same_sign(si["Sun"], si["Mercury"]):
        msg = "Budha–Āditya Yoga: Sun with Mercury—analysis, speech, and authority align."
        hi.append(msg); cat["Career"].append(msg)

    # --- 6) Pañcha Mahāpuruṣa (kendras; own/exaltation)
    PMY = {
        "Mars": ("Ruchaka",  "Courage, command, engineering"),
        "Mercury": ("Bhadra","Intellect, commerce, eloquence"),
        "Jupiter": ("Haṁsa", "Wisdom, ethics, protection"),
        "Venus": ("Mālavya", "Art, comforts, relationships"),
        "Saturn": ("Śaśa",  "Organization, endurance, leadership"),
    }
    for p, (name, gist) in PMY.items():
        if p not in si: continue
        sidx = si[p]; hnum = hi_r[p]
        if _is_kendra(hnum) and (_own_sign(p, sidx) or _exalted(p, sidx)):
            msg = f"{name} Yoga ({p}) in a kendra—{gist.lower()}."
            hi.append(msg)
            # rough routing
            if p in ("Mars","Saturn","Mercury"): cat["Career"].append(msg)
            if p in ("Venus","Jupiter"): cat["Relationships"].append(msg); cat["Foundations"].append(msg)

    # --- 7) Nīcha-bhaṅga (simple checks)
    for p in CLASSICALS:
        if p not in si: continue
        sidx = si[p]
        if not _debilitated(p, sidx): continue
        disp = SIGN_LORDS[sidx]  # dispositor
        disp_house = hi_r.get(disp)
        cancel = False
        if disp_house and _is_kendra(disp_house):
            cancel = True
        elif disp in si and _same_sign(si[disp], sidx):
            cancel = True
        if cancel:
            msg = f"Nīcha-bhaṅga for {p}: debility mitigated by dispositor support—resilience in that domain."
            hi.append(msg); cat["Foundations"].append(msg)

    # --- 8) Parivartana (mutual exchange; generic note)
    exchanges = _parivartana(si)
    for a, b in exchanges:
        msg = f"Parivartana Yoga: mutual exchange between {a} and {b}—themes of both houses interlink strongly."
        hi.append(msg); cat["Foundations"].append(msg)

    # De-dup simple
    dedup = []
    seen_str = set()
    for m in hi:
        if m not in seen_str:
            seen_str.add(m)
            dedup.append(m)

    for k in cat:
        tmp, s2 = [], set()
        for m in cat[k]:
            if m not in s2:
                s2.add(m); tmp.append(m)
        cat[k] = tmp

    return {"highlights": dedup, "by_category": cat}
