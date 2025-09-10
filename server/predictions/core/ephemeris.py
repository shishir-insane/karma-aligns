# core/ephemeris.py
from __future__ import annotations
import math, os, datetime as dt
from dataclasses import dataclass
from typing import Optional, Literal

try:
    import swisseph as swe  # pyswisseph
    _HAS_SWE = True
except Exception:
    _HAS_SWE = False

PrecisionTag = Literal["high", "coarse"]

@dataclass
class GeoPoint:
    lat: float  # degrees
    lon: float  # degrees
    alt: float = 0.0  # meters

@dataclass
class EphemResult:
    lon: float      # ecliptic longitude (0..360)
    lat: float      # ecliptic latitude
    dist: float     # AU
    speed_lon: float
    precision: PrecisionTag

class BaseEphemeris:
    def planet_longitude(self, when: dt.datetime, planet: str, geo: Optional[GeoPoint], ayanamsa: str) -> EphemResult:
        raise NotImplementedError

    def set_ayanamsa(self, ayanamsa: str) -> None:
        pass

SUPPORTED_PLANETS = {
    "SUN": 0, "MOON": 1, "MARS": 4, "MERCURY": 2, "JUPITER": 5,
    "VENUS": 3, "SATURN": 6, "URANUS": 7, "NEPTUNE": 8, "PLUTO": 9, "RAHU": "RAHU", "KETU": "KETU"
}

class SwissEphemerisProvider(BaseEphemeris):
    def __init__(self, eph_path: Optional[str] = None, ayanamsa: str = "lahiri"):
        if not _HAS_SWE:
            raise RuntimeError("Swiss Ephemeris not available")
        if eph_path:
            if not os.path.isdir(eph_path):
                raise FileNotFoundError(f"Swiss ephemeris path not found: {eph_path}")
            swe.set_ephe_path(eph_path)
        self.set_ayanamsa(ayanamsa)

    def set_ayanamsa(self, ayanamsa: str) -> None:
        # Common ayanamsa choices; extend as needed
        mapping = {
            "lahiri": swe.SIDM_LAHIRI,
            "raman": swe.SIDM_RAMAN,
            "krishnamurti": swe.SIDM_KRISHNAMURTI,
            "fagan": swe.SIDM_FAGAN_BRADLEY,
        }
        swe.set_sid_mode(mapping.get(ayanamsa.lower(), swe.SIDM_LAHIRI))

    def planet_longitude(self, when: dt.datetime, planet: str, geo: Optional[GeoPoint], ayanamsa: str) -> EphemResult:
        # Convert to UTC JD
        utc = when.astimezone(dt.timezone.utc)
        jd_ut = swe.julday(utc.year, utc.month, utc.day, utc.hour + utc.minute/60 + utc.second/3600)
        if planet.upper() in ("RAHU", "KETU"):
            # True node, ketu = rahu + 180
            flag = swe.FLG_SWIEPH | swe.FLG_SPEED | swe.FLG_SIDEREAL
            lon, lat, dist, speed_lon = self._node_longitudes(jd_ut, planet.upper() == "KETU", flag)
            return EphemResult(lon%360, lat, dist, speed_lon, "high")

        p_id = SUPPORTED_PLANETS[planet.upper()]
        flag = swe.FLG_SWIEPH | swe.FLG_SPEED | swe.FLG_SIDEREAL
        lon, lat, dist, speed_lon = self._calc_body(jd_ut, p_id, flag)
        return EphemResult(lon%360, lat, dist, speed_lon, "high")

    @staticmethod
    def _calc_body(jd_ut, p_id, flag):
        pos, ret = swe.calc_ut(jd_ut, p_id, flag)
        if ret < 0:
            raise RuntimeError(f"swe.calc_ut error: {ret}")
        # pos = [lon, lat, dist, speed_lon, speed_lat, speed_dist]
        return pos[0], pos[1], pos[2], pos[3]

    @staticmethod
    def _node_longitudes(jd_ut, ketu: bool, flag):
        pos, ret = swe.calc_ut(jd_ut, swe.MEAN_NODE, flag)  # use TRUE_NODE if preferred
        if ret < 0:
            raise RuntimeError(f"swe.calc_ut node error: {ret}")
        lon = (pos[0] + (180.0 if ketu else 0.0)) % 360.0
        return lon, pos[1], pos[2], pos[3]

class ApproxEphemerisProvider(BaseEphemeris):
    """
    Coarse fallback using mean motions; OK for UI previews & tests,
    not for production predictions. Emits precision='coarse'.
    """
    MEAN_MOTION = {  # deg/day approximate sidereal rates
        "SUN": 0.985647, "MOON": 13.176358, "MERCURY": 4.092385, "VENUS": 1.602130,
        "MARS": 0.524039, "JUPITER": 0.083056, "SATURN": 0.033439,
        "URANUS": 0.011958, "NEPTUNE": 0.006886, "PLUTO": 0.004
    }

    def __init__(self, epoch: dt.datetime = dt.datetime(2000,1,1,12, tzinfo=dt.timezone.utc)):
        self.epoch = epoch

    def planet_longitude(self, when: dt.datetime, planet: str, geo: Optional[GeoPoint], ayanamsa: str) -> EphemResult:
        planet = planet.upper()
        if planet in ("RAHU","KETU"):
            # Mean node retrograde ~ -0.0529539 deg/day
            days = (when.astimezone(dt.timezone.utc) - self.epoch).total_seconds()/86400.0
            rahu = (200.0 - 0.0529539*days) % 360
            lon = rahu if planet=="RAHU" else (rahu+180.0)%360
            return EphemResult(lon, 0.0, 1.0, -0.0529539, "coarse")
        rate = self.MEAN_MOTION.get(planet, 1.0)
        days = (when.astimezone(dt.timezone.utc) - self.epoch).total_seconds()/86400.0
        lon = (100.0 + rate*days) % 360.0
        return EphemResult(lon, 0.0, 1.0, rate, "coarse")

def get_ephemeris(ayanamsa: str = "lahiri") -> BaseEphemeris:
    eph_path = os.getenv("SE_EPHE_PATH") or os.getenv("SWISSEPH_PATH")
    if _HAS_SWE:
        try:
            return SwissEphemerisProvider(eph_path, ayanamsa=ayanamsa)
        except Exception as e:
            # Fall back but keep error visible in logs
            print(f"[warn] Swiss Ephemeris init failed: {e}; using ApproxEphemerisProvider")
    return ApproxEphemerisProvider()
