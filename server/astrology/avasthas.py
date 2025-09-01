# astrology/avasthas.py
from __future__ import annotations
from typing import Dict
from .swe_utils import norm360

BALADI = ["Bala","Kumara","Yuva","Vriddha","Mrita"]  # 0-6,6-12,12-18,18-24,24-30 in sign

def _baladi_for_lon(lon: float) -> str:
    deg_in_sign = norm360(lon) % 30.0
    bucket = int(deg_in_sign // 6.0)
    return BALADI[min(bucket, 4)]

def compute_avasthas(planets: Dict[str, dict], asc_idx: int, chalit) -> dict:
    """
    Simple Baladi avasthas per planet, based on degree within sign.
    """
    out = {}
    for name, data in planets.items():
        lon = data.get("lon")
        if lon is None:
            continue
        out[name] = {"baladi": _baladi_for_lon(lon)}
    return {"avasthas": out}
