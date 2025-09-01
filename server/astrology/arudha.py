# astrology/arudha.py
from __future__ import annotations
from typing import Dict, List
from .symbols import SIGN_LORDS

def _sign_idx(lon: float) -> int:
    return int((lon % 360.0) // 30)

def _house_signs_from_asc(asc_idx: int) -> List[int]:
    return [(asc_idx + (h-1)) % 12 for h in range(1,13)]

def _planet_house(planet_name: str, chalit: List[List[str]]) -> int | None:
    for i, bucket in enumerate(chalit, start=1):
        if planet_name in bucket:
            return i
    return None

def compute_arudha(planets: Dict[str, dict], asc_idx: int, chalit: List[List[str]]) -> dict:
    """
    Arudha padas A1..A12.
    Rule: Count distance from house to house-lord's house; project same distance from lord's house.
    Exception: If result equals house or 7th from it → move 10th from the lord's house.
    Returns {"A1": idx, "A2": idx, ...}
    """
    house_signs = _house_signs_from_asc(asc_idx)
    # build planet→house map
    phouse = {pn: _planet_house(pn, chalit) for pn in planets.keys()}
    out = {}
    for h in range(1,13):
        sign_idx = house_signs[h-1]
        lord = SIGN_LORDS[sign_idx]
        lord_house = phouse.get(str(lord))  # lord names in your symbols map match planet keys
        if not lord_house:
            out[f"A{h}"] = None
            continue
        dist = (lord_house - h) % 12
        arudha = ((lord_house + dist - 1) % 12) + 1
        # exception
        if arudha == h or arudha == ((h + 6 - 1) % 12) + 1:
            arudha = ((lord_house + 9 - 1) % 12) + 1  # 10th from lord house
        out[f"A{h}"] = arudha
    return out
