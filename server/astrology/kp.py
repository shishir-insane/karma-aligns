# astrology/kp.py
from __future__ import annotations
from typing import Dict, List, Tuple
from .symbols import SIGN_LORDS
from .nakshatra import NAKSHATRA_LORDS, nakshatra_for_lon
from .swe_utils import norm360

# Vimshottari dasha years (sequence order)
VIM_SEQ = ["Ketu","Venus","Sun","Moon","Mars","Rahu","Jupiter","Saturn","Mercury"]
VIM_YEARS = {"Ketu":7,"Venus":20,"Sun":6,"Moon":10,"Mars":7,"Rahu":18,"Jupiter":16,"Saturn":19,"Mercury":17}
NAK_LEN_DEG = 360.0/27.0

def _sublord_in_nak(lon_deg: float) -> str:
    """
    Compute KP sub-lord inside a nakshatra:
      - start with nakshatra lord
      - subdivide the 13°20' arc in Vimshottari proportional parts following VIM_SEQ starting from the nakshatra lord
    """
    d = norm360(lon_deg)
    # locate nakshatra segment
    nak_idx = int(d // NAK_LEN_DEG)
    start_deg = nak_idx * NAK_LEN_DEG
    pos_in_nak = d - start_deg  # 0..13.333..
    # rotate sequence so it starts with nak lord
    nak_lord = NAKSHATRA_LORDS[nak_idx]
    start = VIM_SEQ.index(nak_lord)
    seq = VIM_SEQ[start:] + VIM_SEQ[:start]
    total = sum(VIM_YEARS[p] for p in VIM_SEQ)  # 120y
    # length per sub in degrees
    nak_deg = NAK_LEN_DEG
    cursor = 0.0
    for p in seq:
        seg = nak_deg * (VIM_YEARS[p] / 120.0)
        if pos_in_nak < cursor + seg:
            return p
        cursor += seg
    return seq[-1]

def compute_kp_significators(planets: Dict[str, dict], cusps: List[float]) -> dict:
    """
    For each planet: sign lord, star lord (nakshatra lord), sub lord.
    For each cusp: sign lord, star lord, sub lord.
    """
    out_planets = {}
    for pn, pdata in planets.items():
        lon = pdata.get("lon")
        if lon is None:
            continue
        sidx = int((norm360(lon)) // 30)
        sign_lord = SIGN_LORDS[sidx]
        nidx, _, _, _ = nakshatra_for_lon(lon)
        star_lord = NAKSHATRA_LORDS[nidx]
        sub_lord = _sublord_in_nak(lon)
        out_planets[pn] = {
            "sign_lord": str(sign_lord),
            "star_lord": str(star_lord),
            "sub_lord": str(sub_lord),
        }

    out_cusps = []
    for i, cl in enumerate(cusps, start=1):
        sidx = int((norm360(cl)) // 30)
        sign_lord = SIGN_LORDS[sidx]
        nidx, _, _, _ = nakshatra_for_lon(cl)
        star_lord = NAKSHATRA_LORDS[nidx]
        sub_lord = _sublord_in_nak(cl)
        out_cusps.append({
            "cusp": i,
            "sign_lord": str(sign_lord),
            "star_lord": str(star_lord),
            "sub_lord": str(sub_lord),
        })

    return {"planets": out_planets, "cusps": out_cusps}
