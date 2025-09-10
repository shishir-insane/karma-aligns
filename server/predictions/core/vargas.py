# core/vargas.py
from __future__ import annotations
from typing import Tuple

SIGNS = ["AR","TA","GE","CA","LE","VI","LI","SC","SG","CP","AQ","PI"]

def _sign_index(lon: float) -> int:
    return int(lon // 30) % 12

def _sign_name(idx: int) -> str:
    return SIGNS[idx%12]

def _navamsa_sign(lon: float) -> int:
    # Each sign split into 9 parts of 3°20'. Counting starts from sign's own triplicity sequence.
    sign = _sign_index(lon)
    pos = lon % 30.0
    pada = int(pos // (30.0/9.0))  # 0..8
    # Fire signs start from AR; Earth from CP; Air from LI; Water from CA
    starts = {0:0, 4:0, 8:0,  # fire
              1:9, 5:9, 9:9,  # earth -> starts at CP (index 9)
              2:6, 6:6,10:6,  # air  -> starts at LI (index 6)
              3:3, 7:3,11:3}  # water-> starts at CA (index 3)
    start_sign = starts[sign]
    return (start_sign + pada) % 12

def _dashamsa_sign(lon: float) -> int:
    # D10: ten parts of 3°. Odd signs start from the sign itself; even signs start from the 9th from it
    sign = _sign_index(lon)
    pos = lon % 30.0
    decan = int(pos // 3.0)  # 0..9
    if sign % 2 == 0:  # odd index? (AR=0 -> odd sign per tradition; here 0 treated as odd sign)
        start = sign
    else:
        start = (sign + 8) % 12  # 9th from sign
    return (start + decan) % 12

def d9_sign(lon: float) -> str:
    return _sign_name(_navamsa_sign(lon))

def d10_sign(lon: float) -> str:
    return _sign_name(_dashamsa_sign(lon))
