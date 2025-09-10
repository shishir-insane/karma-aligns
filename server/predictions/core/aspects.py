# core/aspects.py
from __future__ import annotations
from typing import Dict, List, Tuple

SPECIAL = {
    "MARS": [60*1.5, 60*3],       # 90, 240 from source long
    "JUPITER": [60*2, 60*5],      # 120, 300
    "SATURN": [60*1, 60*4.5],     # 60, 270
}
ALL_PLANETS = ("SUN","MOON","MERCURY","VENUS","MARS","JUPITER","SATURN","RAHU","KETU")

def _delta(a: float, b: float) -> float:
    d = abs((a-b+180)%360 - 180)
    return d

def graha_drishti(planet_lons: Dict[str,float], orb_deg: float = 3.0) -> List[Tuple[str,str,str,float]]:
    """
    Returns list of (source, target, type, delta_deg).
    type: '7th' or 'special'
    """
    out = []
    items = list(planet_lons.items())
    for i,(p, lon_p) in enumerate(items):
        # 7th
        for j,(q, lon_q) in enumerate(items):
            if i==j: continue
            d = _delta((lon_p+180)%360, lon_q)
            if d <= orb_deg:
                out.append((p,q,"7th",d))
        # special
        for ang in SPECIAL.get(p, []):
            for j,(q, lon_q) in enumerate(items):
                if i==j: continue
                d = _delta((lon_p+ang)%360, lon_q)
                if d <= orb_deg:
                    out.append((p,q,"special",d))
    return out
