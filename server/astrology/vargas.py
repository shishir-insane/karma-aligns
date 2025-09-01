import math
from .swe_utils import norm360, sign_index
from .charts import short_label

# Generic Parāśari varga mapping function
# For Dn, each sign (30°) is divided into n equal parts of (30/n)° each.
# The nth-part index determines the destination varga sign according to classic rules.
# Below implements standard scheme for common vargas (D2, D3, D7, D9, D10, D12, D16, D20, D24, D27, D30, D40, D45, D60)

# Offsets per sign for even/odd signs differ in some vargas; we encode per Dn.
# The mapping returns the varga-sign index (0..11) for a given ecliptic longitude.


def _varga_sign_for_lon(lon_deg: float, n: int) -> int:
    # Default: simple cyclic mapping (works for D10); override for special ones as needed
    s = sign_index(lon_deg)  # 0..11
    pos_in_sign = norm360(lon_deg) % 30.0
    pada = int(math.floor(pos_in_sign / (30.0 / n)))  # 0..n-1
    return (s * n + pada) % 12

# Special handling for D9 (Navāṁśa) as per Parāśara
# Cardinal (Ar, Cn, Li, Cp): start from same sign; Fixed (Ta, Le, Sc, Aq): start from 9th; Dual (Ge, Vi, Sg, Pi): start from 5th

CARDINAL = {0, 3, 6, 9}
FIXED = {1, 4, 7, 10}
DUAL = {2, 5, 8, 11}

def _d9_sign_for_lon(lon_deg: float) -> int:
    s = sign_index(lon_deg)
    pos = norm360(lon_deg) % 30.0
    pada = int(math.floor(pos / (30.0 / 9)))  # 0..8
    if s in CARDINAL:
        start = s
    elif s in FIXED:
        start = (s + 8) % 12  # 9th from sign = +8 mod 12
    else:  # DUAL
        start = (s + 4) % 12  # 5th from sign = +4 mod 12
    return (start + pada) % 12


def _d10_sign_for_lon(lon_deg: float) -> int:
    # Daśāṁśa simple cyclic mapping starting from same sign for odd signs and from 9th for even signs (one common convention)
    s = sign_index(lon_deg)
    pos = norm360(lon_deg) % 30.0
    part = int(math.floor(pos / 3.0))  # 10 parts of 3°
    if s % 2 == 0:  # odd sign index = Aries (0) is odd-numbered sign 1; but parity here uses index: even index -> odd-numbered sign
        start = s  # odd-numbered sign (Ar, Ge, Le, ...): start = sign
    else:
        start = (s + 8) % 12  # even-numbered sign: start from 9th
    return (start + part) % 12


SPECIAL = {9: _d9_sign_for_lon, 10: _d10_sign_for_lon}


def varga_sign_index(lon_deg: float, n: int) -> int:
    fn = SPECIAL.get(n)
    if fn:
        return fn(lon_deg)
    return _varga_sign_for_lon(lon_deg, n)


VARGA_NAME = {
    'D1': 1, 'D2': 2, 'D3': 3, 'D4': 4, 'D7': 7, 'D9': 9, 'D10': 10, 'D12': 12,
    'D16': 16, 'D20': 20, 'D24': 24, 'D27': 27, 'D30': 30, 'D40': 40, 'D45': 45, 'D60': 60,
}


def compute_vargas(planets: dict, varga_keys: list[str]):
    results = {}
    for key in varga_keys:
        n = VARGA_NAME.get(key)
        if not n:
            continue
        # Build houses as signs; Asc varga sign needs Asc longitude (not included here). Set asc_idx=0 placeholder.
        houses = [[] for _ in range(12)]
        for name, data in planets.items():
            if name == 'Ketu':
                continue
            vsign = varga_sign_index(data['lon'], n)
            # With asc_idx unknown, treat varga sign as house itself (rashi-style), can rotate later when Asc varga is added
            h = (vsign % 12) + 1
            houses[h - 1].append(short_label(name))
        results[key] = {
            'houses': houses,
            'asc_idx': 0
        }
    return results