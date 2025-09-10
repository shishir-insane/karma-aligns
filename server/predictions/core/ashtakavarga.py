# core/ashtakavarga.py
from __future__ import annotations
from typing import Dict, List, Tuple

SIGNS = ["AR","TA","GE","CA","LE","VI","LI","SC","SG","CP","AQ","PI"]

def sign_idx(lon: float) -> int:
    return int(lon // 30) % 12

# Bindus map for each planet: signs (as offset from planet's sign, 1..12) that receive 1-point
# These are standard tables (can be customized per your school).
BINDU_OFFSETS = {
    "SUN":     [1,2,4,7,8,9,10,11],
    "MOON":    [3,6,7,10,11,12],
    "MARS":    [3,5,6,10,11],
    "MERCURY": [1,2,4,6,8,10,11,12],
    "JUPITER": [5,6,9,11,12],
    "VENUS":   [1,2,3,4,8,11,12],
    "SATURN":  [3,5,6,10,11],
}

# Lagna’s Ashtakavarga (sometimes included); you can omit if you prefer 7-planet SAV.
LAGNA_OFFSETS = [3,6,10,11]  # common rule set

def bhinna_for_planet(planet_lon: float) -> List[int]:
    p_sign = sign_idx(planet_lon)
    points = [0]*12
    return points, p_sign

def planet_binna_ashtakavarga(planet: str, planet_lon: float) -> List[int]:
    points = [0]*12
    src = sign_idx(planet_lon)
    for off in BINDU_OFFSETS[planet]:
        dst = (src + off) % 12
        points[dst] = 1
    return points

def lagna_binna_ashtakavarga(lagna_sign_idx: int) -> List[int]:
    points = [0]*12
    for off in LAGNA_OFFSETS:
        dst = (lagna_sign_idx + off) % 12
        points[dst] = 1
    return points

def sarva_ashtakavarga(natal_longitudes: Dict[str, float], lagna_sign_idx: int | None = None, include_lagna: bool = True) -> Dict[str, List[int] | int]:
    """
    Returns: {"planet_binna": {planet:[0/1 x12]}, "SAV": [0..8 per sign], "totals": {...}}
    """
    planet_binna: Dict[str, List[int]] = {}
    for p in ["SUN","MOON","MARS","MERCURY","JUPITER","VENUS","SATURN"]:
        planet_binna[p] = planet_binna_ashtakavarga(p, natal_longitudes[p])
    if include_lagna and lagna_sign_idx is not None:
        planet_binna["LAGNA"] = lagna_binna_ashtakavarga(lagna_sign_idx)
    # aggregate
    sav = [0]*12
    for arr in planet_binna.values():
        for i,v in enumerate(arr): sav[i]+=v
    return {"planet_binna": planet_binna, "SAV": sav, "totals": {k: sum(v) for k,v in planet_binna.items()}}
