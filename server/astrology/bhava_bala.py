# astrology/bhava_bala.py
from __future__ import annotations
from typing import Dict, List

BENEFICS = {"Jupiter","Venus","Mercury","Moon"}
MALEFICS = {"Saturn","Mars","Sun","Rahu","Ketu"}

def compute_bhava_bala(planets: Dict[str, dict], chalit: List[List[str]]) -> dict:
    """
    Simple house strength proxy:
      - benefic_count, malefic_count, net = benefic - malefic per house (1..12)
    """
    houses = []
    for i in range(12):
        bucket = chalit[i] if i < len(chalit) else []
        b = sum(1 for p in bucket if p in BENEFICS)
        m = sum(1 for p in bucket if p in MALEFICS)
        houses.append({"house": i+1, "benefics": b, "malefics": m, "net": b - m})
    return {"bhava_bala": houses}
