# core/yoga_engine.py
from __future__ import annotations
from dataclasses import dataclass
from typing import Dict, List, Any, Optional, Tuple, Callable

@dataclass
class YogaHit:
    name: str
    score: float
    evidence: Dict[str, Any]

# --- Helpers ---
def sign_idx(lon: float) -> int: return int(lon//30)%12
def in_sign(lon: float, idx: int) -> bool: return sign_idx(lon)==idx

def has_aspect(aspect_hits: List[Tuple[str,str,str,float]], src: str, dst: str, kinds=("7th","special")) -> bool:
    for s,t,k,_ in aspect_hits:
        if s==src and t==dst and k in kinds: return True
    return False

# --- Rule DSL ---
# Example rule:
# {
#   "name": "Gaja-Kesari",
#   "when": {
#       "MOON": {"in_kendra_from": "JUPITER"},   # simplified: same sign or 4/7/10 from it
#       "JUPITER": {"not_debilitated": True}
#   },
#   "score": 2.0,
#   "explain": "Moon in kendra from Jupiter and Jupiter not debilitated."
# }

def _kendra_idxs(idx: int) -> List[int]:
    return [idx, (idx+3)%12, (idx+6)%12, (idx+9)%12]

DEBILITATION = {
    "SUN": 6, "MOON": 8, "MARS": 6, "MERCURY": 11, "JUPITER": 9, "VENUS": 11, "SATURN": 1
}  # sign indices for debilitation (Pisces=11 etc.; adjust to your mapping)

def evaluate_rules(
    rules: List[Dict[str,Any]],
    lons: Dict[str,float],                     # natal longitudes
    aspects: List[Tuple[str,str,str,float]],   # from core/aspects
    varga_signs: Dict[str, Dict[str,str]] | None = None,  # e.g., {"D9":{"VENUS":"TA",...}}
    sav: List[int] | None = None
) -> List[YogaHit]:
    hits: List[YogaHit] = []
    sidx = {p: sign_idx(lon) for p,lon in lons.items()}
    for r in rules:
        ok = True
        ev = {}
        cond = r.get("when", {})
        for p, c in cond.items():
            if "in_sign" in c:
                target = c["in_sign"]
                if sidx[p] != target: ok=False; break
                ev[f"{p}.in_sign"]=True
            if "not_debilitated" in c and c["not_debilitated"]:
                if sidx[p] == DEBILITATION.get(p, -1): ok=False; break
                ev[f"{p}.not_debilitated"]=True
            if "in_kendra_from" in c:
                ref = c["in_kendra_from"]
                ref_idx = sidx[ref]
                if sidx[p] not in _kendra_idxs(ref_idx): ok=False; break
                ev[f"{p}.kendra_from_{ref}"]=True
            if "has_aspect_on" in c:
                dst = c["has_aspect_on"]
                if not has_aspect(aspects, p, dst): ok=False; break
                ev[f"{p}.aspects_{dst}"]=True
            if "sav_min" in c and sav is not None:
                # check SAV in the sign holding planet p
                if sav[sidx[p]] < c["sav_min"]: ok=False; break
                ev[f"SAV[{sidx[p]}]>=min"]=True
            if "in_varga_sign" in c and varga_signs is not None:
                chart = c["in_varga_sign"]["chart"]
                sign = c["in_varga_sign"]["sign"]
                if varga_signs.get(chart,{}).get(p) != sign: ok=False; break
                ev[f"{p}.{chart}=={sign}"]=True
        if ok:
            hits.append(YogaHit(r["name"], r.get("score",1.0), {"explain": r.get("explain",""), **ev}))
    return hits
