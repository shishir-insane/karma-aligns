# backend/api/parts.py
"""
Small, focused endpoints that mirror slices of /api/v1/compute.

Exposes:
- GET  /api/v1/chart/id              → stable chart_id from inputs (also seeds cache mapping)
- GET  /api/v1/asc                   → Ascendant {lon, idx}
- GET  /api/v1/houses                → Placidus cusps + asc_sidereal
- GET  /api/v1/planets               → minimal planet longs/speeds/retro flags
- GET  /api/v1/charts/rashi          → rashi chart (12 lists) + asc_idx
- GET  /api/v1/charts/chalit         → chalit chart (12 lists)
- GET  /api/v1/vargas                → vargas maps (Dx: {asc_idx, houses})
- GET  /api/v1/table/planets         → formatted planet table
- GET  /api/v1/shadbala              → components + total
- GET  /api/v1/dasha                 → dasha systems (Vimshottari/Yogini/Ashtottari/Kalachakra)
- GET  /api/v1/varsha                → varshaphala (+ predictions if available)
- GET  /api/v1/acg                   → astrocartography lines + advice
- GET  /api/v1/symbols               → rashis + sign_symbols

Query:
  Either pass:
    ?dob=YYYY-MM-DD&tob=HH:MM&tz=±HH:MM&lat=..&lon=..[&ayanamsa=lahiri&hsys=P]
  Or:
    ?chart_id=...  (must have been seeded via /api/v1/chart/id)

Notes:
- All endpoints call init_swe() to honor EPHE_PATH/SIDEREAL_AYANAMSA from config.
- Caching (10 min default) uses Flask-Caching if present.
- Errors are plain JSON with {"error":{...}}; no stack traces.
"""

from __future__ import annotations
from datetime import datetime, timedelta
from flask import jsonify, request
from flask import current_app as app

from . import api
from .common import (
    parse_query_or_id,
    chart_id_for,
    init_swe,
    cache_get,
    cache_set,
    set_chart_inputs,
)

from astrology.swe_utils import sign_index

# ----------------- helpers -----------------

def _tz_hours(s: str) -> float:
    s = (s or "").strip()
    if not s:
        return 0.0
    sign = -1 if s.startswith("-") else 1
    s = s.lstrip("+-")
    if ":" in s:
        hh, mm = s.split(":", 1)
        return sign * (int(hh) + int(mm) / 60.0)
    return sign * float(s)

def _json_error(msg: str, *, code: int = 400, type_: str = "bad_request"):
    return jsonify({"error": {"type": type_, "message": msg}}), code

# ----------------- endpoints -----------------

@api.get("/chart/id")
def chart_id():
    """
    Return/seed a chart_id. If inputs are given, compute CID and seed mapping.
    If chart_id is provided (and known), just echo it.
    """
    try:
        dob, tob, tz, lat, lon, ayan, hs, cid = parse_query_or_id()
    except ValueError as e:
        return _json_error(str(e), code=400)

    if cid:
        return jsonify({"chart_id": cid})

    init_swe()
    cid = chart_id_for(dob, tob, tz, lat, lon, ayan, hs)
    set_chart_inputs(cid, dob, tob, tz, lat, lon, ayan, hs)
    return jsonify({"chart_id": cid})


@api.get("/asc")
def asc():
    try:
        dob, tob, tz, lat, lon, ayan, hs, _cid = parse_query_or_id()
    except ValueError as e:
        return _json_error(str(e), code=400)

    init_swe()
    key = f"asc|{dob}|{tob}|{tz}|{lat:.6f}|{lon:.6f}|{ayan}|{hs}"
    if (hit := cache_get(key)) is not None:
        return jsonify(hit)

    try:
        from astrology.houses import compute_cusps
    except Exception:
        return _json_error("astrology package not importable", code=501, type_="missing_dependency")

    tz_h = _tz_hours(tz)
    _, asc_lon = compute_cusps(datetime.fromisoformat(f"{dob}T{tob}:00"), tz_h, lat, lon, hsys=hs)
    payload = {
        "asc": {"lon": asc_lon, "idx": sign_index(asc_lon)},
        "chart_id": chart_id_for(dob, tob, tz, lat, lon, ayan, hs),
    }
    cache_set(key, payload)
    return jsonify(payload)


@api.get("/houses")
def houses():
    try:
        dob, tob, tz, lat, lon, ayan, hs, _cid = parse_query_or_id()
    except ValueError as e:
        return _json_error(str(e), code=400)

    init_swe()
    key = f"houses|{dob}|{tob}|{tz}|{lat:.6f}|{lon:.6f}|{ayan}|{hs}"
    if (hit := cache_get(key)) is not None:
        return jsonify(hit)

    try:
        from astrology.houses import compute_cusps
    except Exception:
        return _json_error("astrology package not importable", code=501, type_="missing_dependency")

    tz_h = _tz_hours(tz)
    cusps, asc_lon = compute_cusps(datetime.fromisoformat(f"{dob}T{tob}:00"), tz_h, lat, lon, hsys=hs)
    payload = {
        "cusps": cusps,
        "asc_sidereal": asc_lon,
        "chart_id": chart_id_for(dob, tob, tz, lat, lon, ayan, hs),
    }
    cache_set(key, payload)
    return jsonify(payload)


@api.get("/planets")
def planets():
    try:
        dob, tob, tz, lat, lon, ayan, hs, _cid = parse_query_or_id()
    except ValueError as e:
        return _json_error(str(e), code=400)

    init_swe()
    key = f"planets|{dob}|{tob}|{tz}|{lat:.6f}|{lon:.6f}|{ayan}|{hs}"
    if (hit := cache_get(key)) is not None:
        return jsonify(hit)

    try:
        from astrology.planets import compute_planets
    except Exception:
        return _json_error("astrology package not importable", code=501, type_="missing_dependency")

    tz_h = _tz_hours(tz)
    data = compute_planets(datetime.fromisoformat(f"{dob}T{tob}:00"), tz_h, lat, lon, ayanamsa=ayan)
    planets_min = {
        k: {"lon": v.get("lon"), "speed": v.get("speed"), "retrograde": v.get("retrograde")}
        for k, v in data.items()
    }
    payload = {"planets": planets_min, "chart_id": chart_id_for(dob, tob, tz, lat, lon, ayan, hs)}
    cache_set(key, payload)
    return jsonify(payload)


@api.get("/charts/rashi")
def charts_rashi():
    try:
        dob, tob, tz, lat, lon, ayan, hs, _cid = parse_query_or_id()
    except ValueError as e:
        return _json_error(str(e), code=400)

    init_swe()
    key = f"rashi|{dob}|{tob}|{tz}|{lat:.6f}|{lon:.6f}|{ayan}|{hs}"
    if (hit := cache_get(key)) is not None:
        return jsonify(hit)

    try:
        from astrology.planets import compute_planets
        from astrology.houses import compute_cusps
        from astrology.charts import rashi_from_longitudes
    except Exception:
        return _json_error("astrology package not importable", code=501, type_="missing_dependency")

    tz_h = _tz_hours(tz)
    dt = datetime.fromisoformat(f"{dob}T{tob}:00")
    p = compute_planets(dt, tz_h, lat, lon, ayanamsa=ayan)
    _, asc_lon = compute_cusps(dt, tz_h, lat, lon, hsys=hs)
    rashi = rashi_from_longitudes(p, sign_index(asc_lon))
    payload = {
        "rashi": rashi,
        "asc_idx": sign_index(asc_lon),
        "chart_id": chart_id_for(dob, tob, tz, lat, lon, ayan, hs),
    }
    cache_set(key, payload)
    return jsonify(payload)


@api.get("/charts/chalit")
def charts_chalit():
    try:
        dob, tob, tz, lat, lon, ayan, hs, _cid = parse_query_or_id()
    except ValueError as e:
        return _json_error(str(e), code=400)

    init_swe()
    key = f"chalit|{dob}|{tob}|{tz}|{lat:.6f}|{lon:.6f}|{ayan}|{hs}"
    if (hit := cache_get(key)) is not None:
        return jsonify(hit)

    try:
        from astrology.planets import compute_planets
        from astrology.houses import compute_cusps
        from astrology.charts import chalit_from_longitudes
    except Exception:
        return _json_error("astrology package not importable", code=501, type_="missing_dependency")

    tz_h = _tz_hours(tz)
    dt = datetime.fromisoformat(f"{dob}T{tob}:00")
    p = compute_planets(dt, tz_h, lat, lon, ayanamsa=ayan)
    cusps, _ = compute_cusps(dt, tz_h, lat, lon, hsys=hs)
    chalit = chalit_from_longitudes(p, cusps)
    payload = {"chalit": chalit, "chart_id": chart_id_for(dob, tob, tz, lat, lon, ayan, hs)}
    cache_set(key, payload)
    return jsonify(payload)


@api.get("/vargas")
def vargas():
    """
    GET /api/v1/vargas?vargas=D9,D10 (default D9,D10)
    Shape mirrors /compute → charts.vargas.{Dx}: {asc_idx, houses}.  (matches your payload)  # see compute payload
    """
    try:
        dob, tob, tz, lat, lon, ayan, hs, _cid = parse_query_or_id()
    except ValueError as e:
        return _json_error(str(e), code=400)

    wanted = request.args.get("vargas", "D9,D10")
    wanted_list = [s.strip().upper() for s in wanted.split(",") if s.strip()]

    init_swe()
    key = f"vargas|{wanted}|{dob}|{tob}|{tz}|{lat:.6f}|{lon:.6f}|{ayan}|{hs}"
    if (hit := cache_get(key)) is not None:
        return jsonify(hit)

    try:
        from astrology.planets import compute_planets
        from astrology.vargas import compute_vargas
    except Exception:
        return _json_error("astrology package not importable", code=501, type_="missing_dependency")

    tz_h = _tz_hours(tz)
    dt = datetime.fromisoformat(f"{dob}T{tob}:00")
    p = compute_planets(dt, tz_h, lat, lon, ayanamsa=ayan)
    varga_maps = compute_vargas(p, wanted_list)  # -> {Dx: {asc_idx, houses}} :contentReference[oaicite:4]{index=4}
    payload = {"vargas": varga_maps, "chart_id": chart_id_for(dob, tob, tz, lat, lon, ayan, hs)}
    cache_set(key, payload)
    return jsonify(payload)


@api.get("/table/planets")
def table_planets():
    """
    Returns the formatted planet table (same as compute.table).
    """
    try:
        dob, tob, tz, lat, lon, ayan, hs, _cid = parse_query_or_id()
    except ValueError as e:
        return _json_error(str(e), code=400)

    init_swe()
    key = f"ptable|{dob}|{tob}|{tz}|{lat:.6f}|{lon:.6f}|{ayan}|{hs}"
    if (hit := cache_get(key)) is not None:
        return jsonify(hit)

    try:
        from astrology.planets import compute_planets
        from astrology.houses import compute_cusps
        from astrology.formatting import build_planet_table
    except Exception:
        return _json_error("astrology package not importable", code=501, type_="missing_dependency")

    tz_h = _tz_hours(tz)
    dt = datetime.fromisoformat(f"{dob}T{tob}:00")
    p = compute_planets(dt, tz_h, lat, lon, ayanamsa=ayan)
    _, asc_lon = compute_cusps(dt, tz_h, lat, lon, hsys=hs)
    table = build_planet_table(p, sign_index(asc_lon))
    payload = {"table": table, "chart_id": chart_id_for(dob, tob, tz, lat, lon, ayan, hs)}
    cache_set(key, payload)
    return jsonify(payload)


@api.get("/shadbala")
def shadbala():
    """
    Returns components + total, matching your compute payload.  :contentReference[oaicite:5]{index=5}
    """
    try:
        dob, tob, tz, lat, lon, ayan, hs, _cid = parse_query_or_id()
    except ValueError as e:
        return _json_error(str(e), code=400)

    init_swe()
    key = f"shadbala|{dob}|{tob}|{tz}|{lat:.6f}|{lon:.6f}|{ayan}|{hs}"
    if (hit := cache_get(key)) is not None:
        return jsonify(hit)

    try:
        from astrology.planets import compute_planets
        from astrology.houses import compute_cusps
        from astrology.shadbala import compute_shadbala
    except Exception:
        return _json_error("astrology package not importable", code=501, type_="missing_dependency")

    tz_h = _tz_hours(tz)
    dt = datetime.fromisoformat(f"{dob}T{tob}:00")
    p = compute_planets(dt, tz_h, lat, lon, ayanamsa=ayan)
    _, asc_lon = compute_cusps(dt, tz_h, lat, lon, hsys=hs)
    asc_idx = sign_index(asc_lon)
    sb = compute_shadbala(p, asc_idx, None, local_hour=dt.hour)  # chalit not needed for totals in your lib
    payload = {"shadbala": sb, "chart_id": chart_id_for(dob, tob, tz, lat, lon, ayan, hs)}
    cache_set(key, payload)
    return jsonify(payload)


@api.get("/dasha")
def dasha():
    """
    Returns all dasha systems present in your compute payload under one key:
      { "dasha": { "Vimshottari": {...}, "Yogini": {...}, "Ashtottari": {...}, "Kalachakra": {...} } }
    Shapes include `active` and `timeline` like your sample.  :contentReference[oaicite:6]{index=6}
    """
    try:
        dob, tob, tz, lat, lon, ayan, hs, _cid = parse_query_or_id()
    except ValueError as e:
        return _json_error(str(e), code=400)

    init_swe()
    key = f"dasha|{dob}|{tob}|{tz}|{lat:.6f}|{lon:.6f}|{ayan}|{hs}"
    if (hit := cache_get(key)) is not None:
        return jsonify(hit)

    try:
        from astrology.planets import compute_planets
        from astrology.dasha import (
            compute_vimsottari, compute_yogini, compute_ashtottari, compute_kalachakra
        )
    except Exception:
        return _json_error("astrology package not importable", code=501, type_="missing_dependency")

    tz_h = _tz_hours(tz)
    dt = datetime.fromisoformat(f"{dob}T{tob}:00")
    moon_lon = compute_planets(dt, tz_h, lat, lon, ayanamsa=ayan).get("Moon", {}).get("lon")
    if moon_lon is None:
        return _json_error("Moon longitude unavailable for dasha", code=422, type_="unprocessable")

    payload = {
        "dasha": {
            "Vimshottari": compute_vimsottari(dt, tz_h, moon_lon),
            "Yogini": compute_yogini(dt, tz_h, moon_lon),
            "Ashtottari": compute_ashtottari(dt, tz_h, moon_lon),
            "Kalachakra": compute_kalachakra(dt, tz_h, moon_lon),
        },
        "chart_id": chart_id_for(dob, tob, tz, lat, lon, ayan, hs),
    }
    cache_set(key, payload)
    return jsonify(payload)


@api.get("/varsha")
def varsha():
    """
    Varshaphala year: uses request ?varsha_year=YYYY, else defaults to local-now (tz) year + 1.
    Returns {varsha, varsha_predictions?}. Mirrors compute payload shape.
    """
    try:
        dob, tob, tz, lat, lon, ayan, hs, _cid = parse_query_or_id()
    except ValueError as e:
        return _json_error(str(e), code=400)

    init_swe()

    # derive local "now" in same tz as request
    tz_h = _tz_hours(tz)
    local_now = datetime.utcnow() + timedelta(hours=tz_h)
    varsha_year = request.args.get("varsha_year", type=int)
    varsha_year = varsha_year if varsha_year is not None else (local_now.year + 1)

    key = f"varsha|{varsha_year}|{dob}|{tob}|{tz}|{lat:.6f}|{lon:.6f}|{ayan}|{hs}"
    if (hit := cache_get(key)) is not None:
        return jsonify(hit)

    try:
        from astrology.varshaphala import compute_varshaphala
    except Exception:
        return _json_error("astrology package not importable", code=501, type_="missing_dependency")

    dt = datetime.fromisoformat(f"{dob}T{tob}:00")
    try:
        v = compute_varshaphala(dt, tz_h, lat, lon, varsha_year=int(varsha_year))
    except Exception as e:
        app.logger.warning("varshaphala failed: %s", e)
        v = None

    varsha_predictions = v.get("predictions") if isinstance(v, dict) else None
    payload = {
        "varsha": v,
        "varsha_predictions": varsha_predictions,
        "chart_id": chart_id_for(dob, tob, tz, lat, lon, ayan, hs),
    }
    cache_set(key, payload)
    return jsonify(payload)


@api.get("/acg")
def acg():
    """
    Astrocartography: returns {"acg": {"lines": {...}, "advice": {...}}}
    Shape mirrors your compute response (lines + plain-language advice).  :contentReference[oaicite:7]{index=7}
    """
    try:
        dob, tob, tz, lat, lon, ayan, hs, _cid = parse_query_or_id()
    except ValueError as e:
        return _json_error(str(e), code=400)

    init_swe()
    key = f"acg|{dob}|{tob}|{tz}|{lat:.6f}|{lon:.6f}|{ayan}|{hs}"
    if (hit := cache_get(key)) is not None:
        return jsonify(hit)

    try:
        from astrology.astrocartography import compute_astrocartography
    except Exception:
        return _json_error("astrology package not importable", code=501, type_="missing_dependency")

    tz_h = _tz_hours(tz)
    dt = datetime.fromisoformat(f"{dob}T{tob}:00")
    acg_obj = compute_astrocartography(dt, tz_h)
    payload = {"acg": acg_obj, "chart_id": chart_id_for(dob, tob, tz, lat, lon, ayan, hs)}
    cache_set(key, payload)
    return jsonify(payload)


@api.get("/symbols")
def symbols():
    """
    Returns rashis + sign_symbols to let the client label charts without calling /compute.
    """
    try:
        from astrology.symbols import SIGN_NAMES, SIGN_SYMBOLS
    except Exception:
        return _json_error("astrology package not importable", code=501, type_="missing_dependency")

    return jsonify({"rashis": SIGN_NAMES, "sign_symbols": SIGN_SYMBOLS})
