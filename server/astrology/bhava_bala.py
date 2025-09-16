# astrology/bhava_bala.py
from __future__ import annotations
from typing import Dict, List, Any, Optional, Tuple

# --- Legacy behavior (kept intact) -----------------------------------------

BENEFICS = {"Jupiter","Venus","Mercury","Moon"}
MALEFICS = {"Saturn","Mars","Sun","Rahu","Ketu"}

def compute_bhava_bala(planets: Dict[str, dict], chalit: List[List[str]]) -> dict:
    """
    Simple house strength proxy:
      - benefic_count, malefic_count, net = benefic - malefic per house (1..12)
    Returns:
      {"bhava_bala": [{"house":1,"benefics":b,"malefics":m,"net":b-m}, ...]}
    """
    houses = []
    for i in range(12):
        bucket = chalit[i] if i < len(chalit) else []
        b = sum(1 for p in bucket if p in BENEFICS)
        m = sum(1 for p in bucket if p in MALEFICS)
        houses.append({"house": i+1, "benefics": b, "malefics": m, "net": b - m})
    return {"bhava_bala": houses}

# --- Added: Bhava Bala normalization -> Virupa/Rupa helpers -----------------

DEFAULT_BHAVA_COMPONENT_MAX_VIRUPA: Dict[str, int] = {
    "bhava_drik": 90,   # net aspects to house (benefics - malefics) mapped to [0..1] then to virupa
    "kendradhi": 60,    # kendra/panaphara/apoklima bonus mapped to [0..1] then to virupa
    # Stubs for future components: "drekkana", "dig", "graha", "bhavesh", etc.
}

def _bhava_virupa_to_rupa(virupa: float) -> float:
    """Convert Virupa to Rupa (1 Rupa = 60 Virupas)."""
    return virupa / 60.0

def kendradhi_class(house: int) -> float:
    """
    Kendra (1,4,7,10)   -> 1.00
    Panaphara (2,5,8,11)-> 0.66
    Apoklima (3,6,9,12) -> 0.33
    """
    if house in (1,4,7,10):
        return 1.0
    if house in (2,5,8,11):
        return 2/3
    return 1/3

def map_net_to_normalized(net: int, cap: int = 6) -> float:
    """
    Map benefic-minus-malefic 'net' in [-cap, +cap] to [0,1].
    """
    if net > cap: net = cap
    if net < -cap: net = -cap
    return (net + cap) / (2*cap)

def bhava_strength_tier(rupa: float) -> str:
    """
    Tier by total Rupa per house.
      - strong     : 60+ Rūpas
      - functional : 30–59 Rūpas
      - weak       : <30 Rūpas
    """
    if rupa >= 60:
        return "strong (60+ Rūpas)"
    if rupa >= 30:
        return "functional (30–59 Rūpas)"
    return "weak (<30 Rūpas)"

def convert_bhavabala_to_rupas(payload: Dict[str, Any],
                               overrides: Optional[Dict[str, Any]] = None
                              ) -> Dict[str, Any]:
    """
    Upgrade the legacy bhava_bala output with normalized/virupa/rupa conversions.

    Input payload (legacy):
      { "bhava_bala": [ { "house": n, "benefics": int, "malefics": int, "net": int }, ... ] }

    Output:
      {
        "normalized": {house: {"bhava_drik": x, "kendradhi": y}, ...},
        "virupa_rupa": {
          house: {
            "components": {"virupa": {...}, "rupa": {...}},
            "totals": {"virupa": V, "rupa": R}
          }, ...
        },
        "totals": {"virupa": {house: V}, "rupa": {house: R}, "tier": {house: "weak/functional/strong"}},
        "summary": {"ranking_by_rupa": [(house, R), ... desc]},
        "legacy_counts": payload["bhava_bala"]
      }
    """
    overrides = overrides or {}
    bhavas: List[Dict[str, Any]] = payload.get("bhava_bala", [])
    comp_max = {**DEFAULT_BHAVA_COMPONENT_MAX_VIRUPA, **overrides.get("component_max", {})}

    normalized: Dict[int, Dict[str, float]] = {}
    virupa_rupa: Dict[int, Dict[str, Any]] = {}
    totals_virupa: Dict[int, float] = {}
    totals_rupa: Dict[int, float] = {}
    tiers: Dict[int, str] = {}
    ranking: List[Tuple[int, float]] = []

    for row in bhavas:
        h = int(row.get("house"))
        net = int(row.get("net", 0))

        # Normalized components
        n_drik = map_net_to_normalized(net)  # [-6..+6] -> [0..1]
        n_kend = kendradhi_class(h)          # {1.0, 0.66, 0.33}

        normalized[h] = {"bhava_drik": n_drik, "kendradhi": n_kend}

        # Virupa contributions
        v_drik = n_drik * comp_max["bhava_drik"]
        v_kend = n_kend * comp_max["kendradhi"]

        # Rupa conversions
        r_drik = _bhava_virupa_to_rupa(v_drik)
        r_kend = _bhava_virupa_to_rupa(v_kend)

        v_total = v_drik + v_kend
        r_total = r_drik + r_kend

        virupa_rupa[h] = {
            "components": {
                "virupa": {"bhava_drik": v_drik, "kendradhi": v_kend},
                "rupa":   {"bhava_drik": r_drik, "kendradhi": r_kend},
            },
            "totals": {"virupa": v_total, "rupa": r_total}
        }
        totals_virupa[h] = v_total
        totals_rupa[h] = r_total
        tiers[h] = bhava_strength_tier(r_total)
        ranking.append((h, r_total))

    ranking.sort(key=lambda x: x[1], reverse=True)

    return {
        "normalized": normalized,
        "virupa_rupa": virupa_rupa,
        "totals": {"virupa": totals_virupa, "rupa": totals_rupa, "tier": tiers},
        "summary": {"ranking_by_rupa": ranking},
        "legacy_counts": bhavas,
    }

def compute_bhava_bala_enhanced(payload: Dict[str, Any],
                                overrides: Optional[Dict[str, Any]] = None,
                                return_scale: str = "both") -> Dict[str, Any]:
    """
    Wrapper that preserves legacy data and adds classical Virupa/Rupa.
    - return_scale="normalized" -> only normalized block + legacy_counts
    - return_scale="rupas"      -> only virupa/rupa + totals + summary + legacy_counts
    - return_scale="both"       -> everything (default)
    """
    converted = convert_bhavabala_to_rupas(payload, overrides=overrides)

    if return_scale == "normalized":
        return {"normalized": converted["normalized"], "legacy_counts": converted["legacy_counts"]}
    if return_scale == "rupas":
        return {
            "virupa_rupa": converted["virupa_rupa"],
            "totals": converted["totals"],
            "summary": converted["summary"],
            "legacy_counts": converted["legacy_counts"],
        }
    return converted
