from __future__ import annotations
from typing import Dict, List, Tuple, Optional
from math import radians, degrees, sin, cos, atan2, asin, tan, pi
import swisseph as swe
from datetime import datetime, timedelta, timezone

PLANETS = [
    ("Sun", swe.SUN),
    ("Moon", swe.MOON),
    ("Mercury", swe.MERCURY),
    ("Venus", swe.VENUS),
    ("Mars", swe.MARS),
    ("Jupiter", swe.JUPITER),
    ("Saturn", swe.SATURN),
]

def _to_utc(dt_local: datetime, tz_hours: float) -> datetime:
    return (dt_local - timedelta(hours=tz_hours)).replace(tzinfo=timezone.utc)

def _wrap_deg(d: float) -> float:
    # wrap to [-180, 180)
    d = (d + 180.0) % 360.0 - 180.0
    return d

def _gmst_hours(jd_ut: float) -> float:
    # Swiss Ephemeris returns GST at Greenwich (hours)
    return swe.sidtime(jd_ut)

def _ra_dec(body: int, jd_ut: float) -> Tuple[float, float]:
    """
    Return (RA_hours, DEC_degrees) using Swiss Ephemeris in equatorial coordinates.
    Handles both (3 floats) and (values, retflag) return shapes.
    """
    flags = swe.FLG_SWIEPH | swe.FLG_EQUATORIAL | swe.FLG_SPEED
    res = swe.calc_ut(jd_ut, body, flags)

    # pyswisseph can return either:
    # - (lon, lat, dist, lon_speed, lat_speed, dist_speed)
    # - (lon, lat, dist) if speed not requested
    # - ([lon,lat,dist,...], retflag) in some builds
    if isinstance(res, (list, tuple)):
        vals = res
        # unwrap ([...], retflag)
        if len(res) == 2 and isinstance(res[0], (list, tuple)) and len(res[0]) >= 2:
            vals = res[0]
        if len(vals) >= 2:
            ra_deg = float(vals[0])   # with FLG_EQUATORIAL this is RA in degrees
            dec_deg = float(vals[1])  # declination in degrees
            return ra_deg / 15.0, dec_deg

    raise RuntimeError("Swiss Ephemeris RA/Dec extraction failed in _ra_dec()")

def _asc_dsc_curves(ra_h: float, dec_deg: float, gmst_h: float, step: float = 0.5) -> Tuple[List[Dict], List[Dict]]:
    """
    Build ASC/DSC curves by sweeping latitude and solving horizon condition:
        cos(H0) = -tan(phi) * tan(delta)
    Then longitudes come from LST = RA ± H0  and  lon = 15°*(LST - GMST).
    """
    import math
    dec = math.radians(dec_deg)
    asc, dsc = [], []
    lat = -89.9
    while lat <= 89.9 + 1e-9:
        phi = math.radians(lat)
        k = -math.tan(phi) * math.tan(dec)
        if abs(k) <= 1.0:
            H0_h = math.degrees(math.acos(k)) / 15.0  # hour angle in HOURS
            lst_rise = (ra_h - H0_h) % 24.0
            lst_set  = (ra_h + H0_h) % 24.0
            lon_rise = _wrap_deg(15.0 * ((lst_rise - gmst_h) % 24.0))
            lon_set  = _wrap_deg(15.0 * ((lst_set  - gmst_h) % 24.0))
            asc.append({"lat": round(lat, 3), "lon": lon_rise})
            dsc.append({"lat": round(lat, 3), "lon": lon_set})
        lat += step
    return asc, dsc


def _asc_desc_lat_for_lon(ra_h: float, dec_deg: float, gmst_h: float, lon_deg: float) -> Tuple[float, bool]:
    """
    Return latitude (deg) where the body rises/sets for this longitude at given instant,
    using altitude=0 condition: sin h = 0 = sinφ sinδ + cosφ cosδ cosH
    => φ = atan2(-cosδ cosH, sinδ). Rising if H in (-π,0), Setting if H in (0,π).
    """
    dec = radians(dec_deg)
    H = ((gmst_h + lon_deg/15.0 - ra_h) * 15.0)  # deg
    # wrap H to (-180, 180]
    H = _wrap_deg(H)
    Hr = radians(H)
    # handle near-equatorial dec; atan2 safe if sinδ≈0
    num = -cos(dec) * cos(Hr)
    den = sin(dec)
    lat = degrees(atan2(num, den)) if abs(den) > 1e-9 else (90.0 if num < 0 else -90.0)
    rising = Hr < 0.0  # negative hour angle ⇒ rising/eastern horizon
    return max(-89.9, min(89.9, lat)), rising

def compute_astrocartography(dt_local: datetime, tz_hours: float) -> Dict:
    dt_utc = _to_utc(dt_local, tz_hours)
    jd_ut = swe.julday(
        dt_utc.year, dt_utc.month, dt_utc.day,
        dt_utc.hour + dt_utc.minute/60.0 + dt_utc.second/3600.0
    )
    gmst_h = _gmst_hours(jd_ut)

    # Ensure geocentric calculations (avoid any earlier topocentric setting)
    try:
        swe.set_topo(0.0, 0.0, 0.0)
    except Exception:
        pass

    out: Dict[str, Dict] = {}
    lat_step = 0.5  # degrees in latitude for ASC/DSC sampling

    for name, code in PLANETS:
        ra_h, dec_deg = _ra_dec(code, jd_ut)

        # MC longitude where LST == RA
        lon_mc = _wrap_deg((ra_h - gmst_h) * 15.0)
        lon_ic = _wrap_deg(lon_mc + 180.0)

        asc_pts, dsc_pts = _asc_dsc_curves(ra_h, dec_deg, gmst_h, step=lat_step)

        out[name] = {
            "MC": {"lon": lon_mc},
            "IC": {"lon": lon_ic},
            "ASC": asc_pts,
            "DSC": dsc_pts,
        }

    # ---------------- Advice (heuristic) ----------------
    def _fmt_lon(x: float) -> str:
        e = "E" if x >= 0 else "W"
        return f"{abs(round(x, 1))}°{e}"

    advice = {"Career": [], "Love": [], "Health": [], "Caution": []}

    # Career hotspots: Sun/Jupiter on MC; Saturn MC for structure; Mercury ASC for commerce
    advice["Career"].append(f"Sun MC near {_fmt_lon(out['Sun']['MC']['lon'])} meridian")
    advice["Career"].append(f"Jupiter MC near {_fmt_lon(out['Jupiter']['MC']['lon'])} meridian")
    advice["Career"].append(f"Saturn MC (discipline) near {_fmt_lon(out['Saturn']['MC']['lon'])}")
    advice["Career"].append("Mercury ASC curve (trade/communication)")

    # Love & relationships: Venus/Moon
    advice["Love"].append(f"Venus ASC curve and MC at {_fmt_lon(out['Venus']['MC']['lon'])}")
    advice["Love"].append("Moon ASC curve for nurture")

    # Health/wellbeing
    advice["Health"].append("Jupiter ASC curve")
    advice["Health"].append("Sun ASC curve")

    # Cautionary lines
    advice["Caution"].append(f"Mars MC near {_fmt_lon(out['Mars']['MC']['lon'])} (hot/competitive)")
    advice["Caution"].append("Saturn DSC curve (delays, isolation)")

    return {
        "meta": {"utc": dt_utc.isoformat(), "gmst_hours": gmst_h, "sample_step": lat_step},
        "lines": out,
        "advice": advice,
    }

