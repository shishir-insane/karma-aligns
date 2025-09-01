import swisseph as swe
from .swe_utils import to_julian_day, set_sidereal, norm360

PLANET_CODES = {
    "Sun": swe.SUN,
    "Moon": swe.MOON,
    "Mars": swe.MARS,
    "Mercury": swe.MERCURY,
    "Jupiter": swe.JUPITER,
    "Venus": swe.VENUS,
    "Saturn": swe.SATURN,
    # Outer planets
    "Uranus": swe.URANUS,
    "Neptune": swe.NEPTUNE,
    "Pluto": swe.PLUTO,
    # Lunar nodes (mean); Ketu will be derived as opposite
    "Rahu": swe.MEAN_NODE,
}

FLAGS = swe.FLG_SWIEPH | swe.FLG_SIDEREAL | swe.FLG_SPEED  # SPEED => xx has 6 values

def compute_planets(dt_local, tz_offset, lat, lon, ayanamsa="lahiri"):
    jd = to_julian_day(dt_local, tz_offset)
    set_sidereal(ayanamsa)

    out = {}

    for name, code in PLANET_CODES.items():
        # calc_ut returns (xx, retflag); xx = (lon, lat, dist[, lon_speed, lat_speed, dist_speed])
        xx, retflag = swe.calc_ut(jd, code, FLAGS)
        lon_deg = norm360(xx[0])
        lon_speed = xx[3] if len(xx) >= 4 else 0.0
        out[name] = {
            "lon": lon_deg,
            "retro": lon_speed < 0.0,
        }

    # Derive Ketu as opposite of Rahu
    if "Rahu" in out:
        out["Ketu"] = {
            "lon": norm360(out["Rahu"]["lon"] + 180.0),
            "retro": out["Rahu"]["retro"],  # commonly same retro flag
        }

    return out
