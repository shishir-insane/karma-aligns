# core/varshaphal.py
from __future__ import annotations
import datetime as dt
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple, Literal
from core.solar_return import exact_solar_return
from core.ephemeris import BaseEphemeris, GeoPoint

@dataclass
class VarshaResult:
    year: int
    solar_return_utc: dt.datetime
    muntha_sign_idx: int
    varsha_lagna_sign_idx: int
    tajika_aspects: List[Tuple[str,str,str,float]]  # (p1,p2,aspect,orb)

TAJIKA_ASPECTS = {
    "conjunction": 0.0,
    "sextile": 60.0,
    "square": 90.0,
    "trine": 120.0,
    "opposition": 180.0,
}

def _sign_idx(lon: float) -> int: return int(lon//30)%12
def _delta(a: float, b: float) -> float:
    d = abs((a-b+180)%360 - 180)
    return d

def _compute_tajika(planet_lons: Dict[str,float], orb=3.0) -> List[Tuple[str,str,str,float]]:
    out=[]
    items=list(planet_lons.items())
    for i,(p,lp) in enumerate(items):
        for j in range(i+1,len(items)):
            q,lq=items[j]
            for name,deg in TAJIKA_ASPECTS.items():
                d=_delta((lp-lq)%360,deg)
                if d<=orb:
                    out.append((p,q,name,d))
    return out

def varshaphal_for_year(
    eph: BaseEphemeris,
    birth_local: dt.datetime,         # local birth datetime
    natal_sun_lon: float,             # sidereal
    year: int,
    ayanamsa: str = "lahiri",
    location: Optional[GeoPoint] = None
) -> VarshaResult:
    approx_bday_local = birth_local.replace(year=year)
    sr_utc = exact_solar_return(eph, natal_sun_lon, approx_bday_local, ayanamsa, location)
    # Compute varsha chart at solar return instant
    planets = ["SUN","MOON","MERCURY","VENUS","MARS","JUPITER","SATURN","RAHU","KETU"]
    lons = {p: eph.planet_longitude(sr_utc, p, location, ayanamsa).lon for p in planets}
    varsha_lagna = eph.planet_longitude(sr_utc, "SUN", location, ayanamsa)  # placeholder for proper Asc
    # NOTE: Replace above with your proper Ascendant calculation (Stage 1 note). Here we only need sign index:
    varsha_lagna_sign = _sign_idx(lons["SUN"])  # TEMP — swap with true Asc sign when available

    # Muntha: (natal lagna sign + completed years) % 12
    completed_years = year - birth_local.year
    natal_lagna_sign_idx = 0  # <-- supply real natal lagna sign idx from your natal engine
    muntha = (natal_lagna_sign_idx + completed_years) % 12

    tajika = _compute_tajika(lons, orb=3.0)
    return VarshaResult(
        year=year,
        solar_return_utc=sr_utc,
        muntha_sign_idx=muntha,
        varsha_lagna_sign_idx=varsha_lagna_sign,
        tajika_aspects=tajika
    )
