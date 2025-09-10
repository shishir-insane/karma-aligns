# api/handlers.py
from predictions.core.validation import BirthInput
from predictions.core.ephemeris import get_ephemeris, GeoPoint
from guards import CalcContext

def compute_planets(payload: dict) -> dict:
    data = BirthInput(**payload)
    dt_local = data.to_datetime()
    eph = get_ephemeris(ayanamsa=payload.get("ayanamsa", "lahiri"))
    geo = GeoPoint(lat=data.lat, lon=data.lon, alt=data.alt)
    planets = {}
    for name in ("SUN","MOON","MERCURY","VENUS","MARS","JUPITER","SATURN","RAHU","KETU"):
        res = eph.planet_longitude(dt_local, name, geo, payload.get("ayanamsa","lahiri"))
        planets[name] = {"lon": res.lon, "lat": res.lat, "speed": res.speed_lon, "precision": res.precision}
    ctx = CalcContext(unknown_time=(data.time is None), precision=_collect_precision(planets))
    return {"datetime": dt_local.isoformat(), "planets": planets, "context": ctx.__dict__}

def _collect_precision(planets: dict) -> str:
    return "coarse" if any(p["precision"]=="coarse" for p in planets.values()) else "high"
