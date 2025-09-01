# astrology/aspects.py
from __future__ import annotations
from typing import Dict, List
from .swe_utils import norm360

SPECIAL_FULL = {
    "Mars":   [4, 8],
    "Jupiter":[5, 9],
    "Saturn": [3,10],
}

def _sign_idx(lon: float) -> int:
    return int((norm360(lon)) // 30)

def _deg_aspect_orb(src: float, tgt: float, exact_deg: float) -> float:
    """Absolute orb in degrees from exact aspect."""
    d = (norm360(tgt - src) + 360.0) % 360.0
    alt = abs(d - exact_deg)
    return min(alt, 360.0 - alt)

def compute_aspects(planets: Dict[str, dict], asc_idx: int, chalit) -> dict:
    """
    Vedic graha dṛṣṭi (sign-based):
      - All planets aspect 7th sign fully.
      - Mars: +4th & 8th; Jupiter: +5th & 9th; Saturn: +3rd & 10th.
    Returns list of aspects with degrees orb to exact angle.
    """
    names = [k for k in planets.keys()]
    out: List[dict] = []
    for a in names:
        a_lon = planets[a].get("lon")
        if a_lon is None: 
            continue
        a_sign = _sign_idx(a_lon)
        # common 7th
        for b in names:
            if a == b: 
                continue
            b_lon = planets[b].get("lon")
            if b_lon is None:
                continue
            b_sign = _sign_idx(b_lon)
            delta = (b_sign - a_sign) % 12
            # full 7th
            if delta == 6:
                out.append({"from": a, "to": b, "kind": "full", "angle": 180.0,
                            "orb": round(_deg_aspect_orb(a_lon, b_lon, 180.0), 2)})
            # specials
            specials = SPECIAL_FULL.get(a, [])
            for dz, angle in zip([3,4,5,8,9,10], [90,120,150,240,270,300]):  # mapping via 30*dz
                pass  # (just a helper list to map quickly)
            for dz in SPECIAL_FULL.get(a, []):
                if delta == dz:
                    out.append({"from": a, "to": b, "kind": "special",
                                "angle": float(dz*30),
                                "orb": round(_deg_aspect_orb(a_lon, b_lon, dz*30.0), 2)})
    return {"aspects": out}
