from __future__ import annotations
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional, Tuple

from .planets import compute_planets
from .houses import compute_cusps
from .charts import rashi_from_longitudes, chalit_from_longitudes
from .swe_utils import sign_index
from .symbols import SIGN_NAMES

SIGN_LORDS = {
    0: "Mars", 1: "Venus", 2: "Mercury", 3: "Moon", 4: "Sun", 5: "Mercury",
    6: "Venus", 7: "Mars", 8: "Jupiter", 9: "Saturn", 10: "Saturn", 11: "Jupiter"
}

def _norm180(x: float) -> float:
    """Normalize angle to (-180, 180]."""
    x = (x + 180.0) % 360.0 - 180.0
    if x <= -180.0:
        x += 360.0
    return x

def _best_by_grid(target: float, dt_guess_utc: datetime, tz_hours: float, lat: float, lon: float) -> datetime:
    """
    Coarse grid search around guess ±36h with 2h steps to find time minimizing |diff|.
    """
    best_t = None
    best_abs = 1e9
    step = timedelta(hours=2)
    start = dt_guess_utc - timedelta(hours=36)
    end   = dt_guess_utc + timedelta(hours=36)
    t = start
    while t <= end:
        t_local = t + timedelta(hours=tz_hours)
        sun_lon = compute_planets(t_local, tz_hours, lat, lon, ayanamsa='lahiri')["Sun"]["lon"]
        diff = abs(_norm180(target - sun_lon))
        if diff < best_abs:
            best_abs = diff
            best_t = t
        t += step
    return best_t

def _refine_time(target: float, t0_utc: datetime, tz_hours: float, lat: float, lon: float) -> datetime:
    """
    Refine around t0 with shrinking steps (20m, 5m, 1m).
    """
    center = t0_utc
    for minutes in (20, 5, 1):
        win = timedelta(hours=2)
        step = timedelta(minutes=minutes)
        start = center - win
        end   = center + win
        best = center
        best_abs = 1e9
        t = start
        while t <= end:
            sun_lon = compute_planets(t + timedelta(hours=tz_hours), tz_hours, lat, lon, ayanamsa='lahiri')["Sun"]["lon"]
            diff = abs(_norm180(target - sun_lon))
            if diff < best_abs:
                best_abs = diff
                best = t
            t += step
        center = best
    return center

def compute_varshaphala(
    birth_dt_local: datetime,
    tz_hours: float,
    lat: float,
    lon: float,
    year: int
) -> Dict:
    """
    Compute sidereal (Lahiri) Solar Return for `year` and Varṣaphala info:
    - Solar return UTC/local moment
    - Return chart planets, cusps, ascendant
    - Muntha sign/sign-lord and their placement in the return chart
    - Datasets for existing Rāśi/Chalit renderers
    """
    print(year)
    # Natal Sun longitude (sidereal)
    natal_planets = compute_planets(birth_dt_local, tz_hours, lat, lon, ayanamsa='lahiri')
    natal_sun_lon = natal_planets["Sun"]["lon"]

    # Natal Asc (for Muntha)
    _, natal_asc_sid = compute_cusps(birth_dt_local, tz_hours, lat, lon, hsys='P')
    natal_asc_idx = sign_index(natal_asc_sid)

    # Guess around same calendar month/day/time in target year (local), convert to UTC
    guess_local = birth_dt_local.replace(year=year)
    guess_utc = (guess_local - timedelta(hours=tz_hours)).replace(tzinfo=timezone.utc)

    # Coarse search, then refine to ~1 minute
    coarse = _best_by_grid(natal_sun_lon, guess_utc, tz_hours, lat, lon)
    exact_utc = _refine_time(natal_sun_lon, coarse, tz_hours, lat, lon).replace(tzinfo=timezone.utc)
    exact_local = exact_utc + timedelta(hours=tz_hours)

    # Return chart planets/cusps
    ret_planets = compute_planets(exact_local, tz_hours, lat, lon, ayanamsa='lahiri')
    cusps, asc_sid = compute_cusps(exact_local, tz_hours, lat, lon, hsys='P')
    asc_idx = sign_index(asc_sid)

    # House datasets for your chart renderers
    rashi_houses = rashi_from_longitudes(ret_planets, asc_idx)
    chalit_houses = chalit_from_longitudes(ret_planets, cusps)

    # Muntha (age years since birth; advance natal Lagna by age signs)
    age_years = year - birth_dt_local.year
    muntha_sign_idx = (natal_asc_idx + age_years) % 12
    muntha_sign_name = SIGN_NAMES[muntha_sign_idx]
    munthesha = SIGN_LORDS[muntha_sign_idx]

    # Muntha's house in the return chart (count from return asc)
    muntha_house_in_varsha = ((muntha_sign_idx - asc_idx) % 12) + 1

    # Munthesha's house in the return chart (by chalit)
    def _house_of(name: str, houses: List[List[str]]) -> Optional[int]:
        for i, plist in enumerate(houses, start=1):
            if name in plist:
                return i
        return None

    munthesha_house = _house_of(munthesha, chalit_houses)

    return {
        "year": year,
        "moment_utc": exact_utc.isoformat(),
        "moment_local": exact_local.isoformat(),
        "sun_lon_target": natal_sun_lon,
        "asc_sidereal": asc_sid,
        "asc_idx": asc_idx,
        "rashi_houses": rashi_houses,
        "chalit_houses": chalit_houses,
        "planets": ret_planets,
        "muntha": {
            "sign_idx": muntha_sign_idx,
            "sign": muntha_sign_name,
            "lord": munthesha,
            "house_in_return": muntha_house_in_varsha,
            "lord_house_in_return": munthesha_house,
            "age_years": age_years
        }
    }
