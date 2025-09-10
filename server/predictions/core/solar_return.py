# core/solar_return.py
from __future__ import annotations
import datetime as dt
from core.ephemeris import BaseEphemeris, GeoPoint

def exact_solar_return(
    eph: BaseEphemeris,
    natal_sun_lon: float,
    approx_bday_local: dt.datetime,
    ayanamsa: str = "lahiri",
    geo: GeoPoint | None = None
) -> dt.datetime:
    """
    Finds the UTC instant when the Sun's sidereal longitude equals natal_sun_lon (mod 360).
    Search window: approx birthday ± 2 days.
    """
    # Convert window to UTC; search in UTC to avoid DST tricks
    mid = approx_bday_local.astimezone(dt.timezone.utc).replace(tzinfo=dt.timezone.utc)
    t1 = mid - dt.timedelta(days=2)
    t2 = mid + dt.timedelta(days=2)

    def f(t: dt.datetime) -> float:
        lon = eph.planet_longitude(t, "SUN", geo, ayanamsa).lon
        # signed shortest delta natal -> current (want zero)
        d = (lon - natal_sun_lon + 180.0) % 360.0 - 180.0
        return d

    # bracket sign change by stepping
    step = dt.timedelta(hours=6)
    a, b = t1, t1 + step
    fa = f(a)
    while b <= t2:
        fb = f(b)
        if fa == 0:
            return a
        if (fa <= 0 < fb) or (fa >= 0 > fb):
            # refine
            return _binary_refine(f, a, b, tol_sec=5)
        a, b, fa = b, b + step, fb
    # If no sign change (rare if ephemeris fallback), do a secant-ish refine around mid
    return _binary_refine(f, t1, t2, tol_sec=5)

def _binary_refine(f, t1: dt.datetime, t2: dt.datetime, tol_sec=5) -> dt.datetime:
    lo, hi = t1, t2
    flo, fhi = f(lo), f(hi)
    # ensure signs opposite; if not, force anyway
    while (hi - lo).total_seconds() > tol_sec:
        mid = lo + (hi - lo)/2
        fm = f(mid)
        if fm == 0: return mid
        # choose interval that contains root (closest to zero)
        if (flo <= 0 < fm) or (flo >= 0 > fm):
            hi, fhi = mid, fm
        else:
            lo, flo = mid, fm
    return lo + (hi - lo)/2
