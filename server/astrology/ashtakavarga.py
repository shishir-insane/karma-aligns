# astrology/ashtakavarga.py
from __future__ import annotations
from typing import Dict, List
from .swe_utils import norm360

PLANETS_FOR_AV = ["Sun","Moon","Mars","Mercury","Jupiter","Venus","Saturn"]

def _sign_idx(lon: float) -> int:
    return int((norm360(lon)) // 30)

def compute_ashtakavarga(planets: Dict[str, dict], asc_idx: int) -> dict:
    """
    Baseline, sign-based Sarva Ashtakavarga heatmap.
    Not the full Parashari bindu rules — this is a pragmatic, stable fallback:
      - Each classical planet contributes 1 bindu to the sign it occupies.
      - Sarva AV is the sum over planets per sign.
    Returns:
      {
        "pav": { "Sun":[0..11], "Moon":[..], ... },
        "sav": [12 length],
        "asc_idx": asc_idx
      }
    """
    pav: Dict[str, List[int]] = {pn: [0]*12 for pn in PLANETS_FOR_AV}
    for pn in PLANETS_FOR_AV:
        lon = planets.get(pn, {}).get("lon")
        if lon is None:
            continue
        pav[pn][_sign_idx(lon)] += 1

    sav = [0]*12
    for i in range(12):
        sav[i] = sum(pav[pn][i] for pn in PLANETS_FOR_AV)

    return {"pav": pav, "sav": sav, "asc_idx": asc_idx}
