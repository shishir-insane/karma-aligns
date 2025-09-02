# backend/api/parts.py
"""
Small, focused endpoints that mirror slices of /api/v1/compute.

Exposes (selected):
- GET  /api/v1/chart/id
- GET  /api/v1/asc
- GET  /api/v1/houses
- GET  /api/v1/planets
- GET  /api/v1/charts/rashi
- GET  /api/v1/charts/chalit
- GET  /api/v1/vargas
- GET  /api/v1/table/planets
- GET  /api/v1/shadbala
- GET  /api/v1/dasha
- GET  /api/v1/varsha
- GET  /api/v1/acg
- GET  /acg/cities
- GET  /api/v1/symbols
- GET  /api/v1/panchanga
- GET  /api/v1/ashtakavarga
- GET  /api/v1/yogas
- GET  /api/v1/avasthas
- GET  /api/v1/aspects
- GET  /api/v1/upagrahas
- GET  /api/v1/bhava-bala
- GET  /api/v1/arudha
- GET  /api/v1/kp
- GET  /api/v1/grahas          → normalized graha details (sign, nakṣatra+pada, house, lords)
- GET  /api/v1/varsha/details  → Varshaphal subfeatures (Muntha, Sahams, Mudda daśā, annual yogas/aspects)

All endpoints support either:
  ?chart_id=...    (resolved from cache seeded via /api/v1/chart/id)
OR raw query:
  ?dob=YYYY-MM-DD&tob=HH:MM&tz=±HH:MM&lat=..&lon=..[&ayanamsa=lahiri&hsys=P]
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
from math import radians, sin, cos, asin, sqrt
from typing import Iterable, Tuple, Dict, Any, List

from backend.data.cities_top import TOP_CITIES
from flask import request, jsonify
from datetime import datetime

from . import api
from backend.services.acg_cities import compute_acg_cities


# ---------- tolerant import helper ----------
def _imp_first(candidates):
    """
    candidates: list[(module_path, attribute)]
    returns attribute or None (first that imports)
    """
    for mod, name in candidates:
        try:
            m = __import__(mod, fromlist=[name])
            return getattr(m, name)
        except Exception:
            continue
    return None

# ---------- optional symbol maps ----------
try:
    from astrology.symbols import (
        SIGN_NAMES,
        NAKSHATRA_NAMES,
        SIGN_LORDS,
        NAKSHATRA_LORDS,
        SIGN_SYMBOLS,
    )
except Exception:
    SIGN_NAMES = None
    NAKSHATRA_NAMES = None
    SIGN_LORDS = None
    NAKSHATRA_LORDS = None
    SIGN_SYMBOLS = None

# ---------- helpers ----------
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

# ---------- endpoints ----------

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
    """Vargas maps (Dx → {asc_idx, houses}); ?vargas=D9,D10 (default)."""
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
    varga_maps = compute_vargas(p, wanted_list)  # -> {Dx:{asc_idx,houses}}
    payload = {"vargas": varga_maps, "chart_id": chart_id_for(dob, tob, tz, lat, lon, ayan, hs)}
    cache_set(key, payload)
    return jsonify(payload)


@api.get("/table/planets")
def table_planets():
    """Formatted planet table (same shape as compute.table)."""
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
    """Shadbala components + total."""
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
    sb = compute_shadbala(p, asc_idx, None, local_hour=dt.hour)
    payload = {"shadbala": sb, "chart_id": chart_id_for(dob, tob, tz, lat, lon, ayan, hs)}
    cache_set(key, payload)
    return jsonify(payload)


@api.get("/dasha")
def dasha():
    """Dasha systems (Vimshottari, Yogini, Ashtottari, Kalachakra)."""
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
            "Yogini":      compute_yogini(dt, tz_h, moon_lon),
            "Ashtottari":  compute_ashtottari(dt, tz_h, moon_lon),
            "Kalachakra":  compute_kalachakra(dt, tz_h, moon_lon),
        },
        "chart_id": chart_id_for(dob, tob, tz, lat, lon, ayan, hs),
    }
    cache_set(key, payload)
    return jsonify(payload)


@api.get("/varsha")
def varsha():
    """Varshaphala; defaults to request's local (tz) year + 1 when varsha_year is absent."""
    try:
        dob, tob, tz, lat, lon, ayan, hs, _cid = parse_query_or_id()
    except ValueError as e:
        return _json_error(str(e), code=400)

    init_swe()
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
    """Astrocartography lines + advice."""
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
    """Rashis + sign symbols (for client labels)."""
    try:
        from astrology.symbols import SIGN_NAMES, SIGN_SYMBOLS
    except Exception:
        return _json_error("astrology package not importable", code=501, type_="missing_dependency")
    return jsonify({"rashis": SIGN_NAMES, "sign_symbols": SIGN_SYMBOLS})


# -------- optional feature endpoints (best-effort, may 501 if module truly absent) --------

@api.get("/panchanga")
def panchanga():
    try:
        dob, tob, tz, lat, lon, ayan, hs, cid = parse_query_or_id()
    except ValueError as e:
        return _json_error(str(e), code=400)
    init_swe()
    key = f"panchanga|{cid}" if cid else f"panchanga|{dob}|{tob}|{tz}|{lat:.6f}|{lon:.6f}|{ayan}|{hs}"
    if (hit := cache_get(key)) is not None:
        return jsonify(hit)
    fn = _imp_first([
        ("astrology.panchanga","compute_panchanga"),
        ("astrology.panchanga","panchanga"),
        ("astrology.panchang","compute_panchanga"),
    ])
    if not fn:
        return _json_error("panchanga not available", code=501, type_="missing_dependency")
    tz_h = _tz_hours(tz)
    dt = datetime.fromisoformat(f"{dob}T{tob}:00")
    data = fn(dt, tz_h, lat, lon)
    payload = {"panchanga": data, "chart_id": cid or chart_id_for(dob, tob, tz, lat, lon, ayan, hs)}
    cache_set(key, payload)
    return jsonify(payload)


@api.get("/ashtakavarga")
def ashtakavarga():
    try:
        dob, tob, tz, lat, lon, ayan, hs, cid = parse_query_or_id()
    except ValueError as e:
        return _json_error(str(e), code=400)
    init_swe()
    key = f"ashtakavarga|{cid}" if cid else f"ashtakavarga|{dob}|{tob}|{tz}|{lat:.6f}|{lon:.6f}|{ayan}|{hs}"
    if (hit := cache_get(key)) is not None:
        return jsonify(hit)
    try:
        from astrology.planets import compute_planets
        from astrology.houses import compute_cusps
        from astrology.ashtakavarga import compute_ashtakavarga
    except Exception:
        return _json_error("ashtakavarga not available", code=501, type_="missing_dependency")
    tz_h = _tz_hours(tz); dt = datetime.fromisoformat(f"{dob}T{tob}:00")
    planets = compute_planets(dt, tz_h, lat, lon, ayanamsa=ayan)
    _, asc_lon = compute_cusps(dt, tz_h, lat, lon, hsys=hs)
    asc_idx = sign_index(asc_lon)
    data = compute_ashtakavarga(planets, asc_idx)
    payload = {"ashtakavarga": data, "chart_id": cid or chart_id_for(dob, tob, tz, lat, lon, ayan, hs)}
    cache_set(key, payload)
    return jsonify(payload)


@api.get("/yogas")
def yogas():
    try:
        dob, tob, tz, lat, lon, ayan, hs, cid = parse_query_or_id()
    except ValueError as e:
        return _json_error(str(e), code=400)
    init_swe()
    key = f"yogas|{cid}" if cid else f"yogas|{dob}|{tob}|{tz}|{lat:.6f}|{lon:.6f}|{ayan}|{hs}"
    if (hit := cache_get(key)) is not None:
        return jsonify(hit)
    try:
        from astrology.planets import compute_planets
        from astrology.houses import compute_cusps
        from astrology.charts import chalit_from_longitudes
        from astrology.yogas import compute_yogas
    except Exception:
        return _json_error("yogas not available", code=501, type_="missing_dependency")
    tz_h = _tz_hours(tz); dt = datetime.fromisoformat(f"{dob}T{tob}:00")
    p = compute_planets(dt, tz_h, lat, lon, ayanamsa=ayan)
    cusps, _ = compute_cusps(dt, tz_h, lat, lon, hsys=hs)
    chalit = chalit_from_longitudes(p, cusps)
    # asc index from ascendant lon
    asc_idx = sign_index(cusps[0]) if isinstance(cusps,(list,tuple)) and len(cusps)>0 else 0
    data = compute_yogas(p, asc_idx, chalit)
    payload = {"yogas": data, "chart_id": cid or chart_id_for(dob, tob, tz, lat, lon, ayan, hs)}
    cache_set(key, payload)
    return jsonify(payload)


@api.get("/avasthas")
def avasthas():
    try:
        dob, tob, tz, lat, lon, ayan, hs, cid = parse_query_or_id()
    except ValueError as e:
        return _json_error(str(e), code=400)
    init_swe()
    key = f"avasthas|{cid}" if cid else f"avasthas|{dob}|{tob}|{tz}|{lat:.6f}|{lon:.6f}|{ayan}|{hs}"
    if (hit := cache_get(key)) is not None:
        return jsonify(hit)
    try:
        from astrology.planets import compute_planets
        from astrology.houses import compute_cusps
        from astrology.charts import chalit_from_longitudes
        from astrology.avasthas import compute_avasthas
    except Exception:
        return _json_error("avasthas not available", code=501, type_="missing_dependency")
    tz_h = _tz_hours(tz); dt = datetime.fromisoformat(f"{dob}T{tob}:00")
    p = compute_planets(dt, tz_h, lat, lon, ayanamsa=ayan)
    cusps, _ = compute_cusps(dt, tz_h, lat, lon, hsys=hs)
    chalit = chalit_from_longitudes(p, cusps)
    asc_idx = sign_index(cusps[0]) if isinstance(cusps,(list,tuple)) and len(cusps)>0 else 0
    data = compute_avasthas(p, asc_idx, chalit)
    payload = {"avasthas": data, "chart_id": cid or chart_id_for(dob, tob, tz, lat, lon, ayan, hs)}
    cache_set(key, payload)
    return jsonify(payload)


@api.get("/aspects")
def aspects():
    try:
        dob, tob, tz, lat, lon, ayan, hs, cid = parse_query_or_id()
    except ValueError as e:
        return _json_error(str(e), code=400)
    init_swe()
    key = f"aspects|{cid}" if cid else f"aspects|{dob}|{tob}|{tz}|{lat:.6f}|{lon:.6f}|{ayan}|{hs}"
    if (hit := cache_get(key)) is not None:
        return jsonify(hit)
    try:
        from astrology.planets import compute_planets
        from astrology.houses import compute_cusps
        from astrology.charts import chalit_from_longitudes
        from astrology.aspects import compute_aspects
    except Exception:
        return _json_error("aspects not available", code=501, type_="missing_dependency")
    tz_h = _tz_hours(tz); dt = datetime.fromisoformat(f"{dob}T{tob}:00")
    p = compute_planets(dt, tz_h, lat, lon, ayanamsa=ayan)
    cusps, _ = compute_cusps(dt, tz_h, lat, lon, hsys=hs)
    chalit = chalit_from_longitudes(p, cusps)
    asc_idx = sign_index(cusps[0]) if isinstance(cusps,(list,tuple)) and len(cusps)>0 else 0
    data = compute_aspects(p, asc_idx, chalit)
    payload = {"aspects": data, "chart_id": cid or chart_id_for(dob, tob, tz, lat, lon, ayan, hs)}
    cache_set(key, payload)
    return jsonify(payload)


@api.get("/upagrahas")
def upagrahas():
    try:
        dob, tob, tz, lat, lon, ayan, hs, cid = parse_query_or_id()
    except ValueError as e:
        return _json_error(str(e), code=400)
    init_swe()
    key = f"upagrahas|{cid}" if cid else f"upagrahas|{dob}|{tob}|{tz}|{lat:.6f}|{lon:.6f}|{ayan}|{hs}"
    if (hit := cache_get(key)) is not None:
        return jsonify(hit)
    fn = _imp_first([
        ("astrology.upagrahas","compute_upagrahas"),
        ("astrology.upagrahas","upagrahas"),
    ])
    if not fn:
        return _json_error("upagrahas not available", code=501, type_="missing_dependency")
    tz_h = _tz_hours(tz); dt = datetime.fromisoformat(f"{dob}T{tob}:00")
    data = fn(dt, tz_h, lat, lon)
    payload = {"upagrahas": data, "chart_id": cid or chart_id_for(dob, tob, tz, lat, lon, ayan, hs)}
    cache_set(key, payload)
    return jsonify(payload)


@api.get("/bhava-bala")
def bhava_bala():
    try:
        dob, tob, tz, lat, lon, ayan, hs, cid = parse_query_or_id()
    except ValueError as e:
        return _json_error(str(e), code=400)
    init_swe()
    key = f"bhavabala|{cid}" if cid else f"bhavabala|{dob}|{tob}|{tz}|{lat:.6f}|{lon:.6f}|{ayan}|{hs}"
    if (hit := cache_get(key)) is not None:
        return jsonify(hit)
    try:
        from astrology.planets import compute_planets
        from astrology.houses import compute_cusps
        from astrology.charts import chalit_from_longitudes
        from astrology.bhava_bala import compute_bhava_bala
    except Exception:
        return _json_error("bhava_bala not available", code=501, type_="missing_dependency")
    tz_h = _tz_hours(tz); dt = datetime.fromisoformat(f"{dob}T{tob}:00")
    p = compute_planets(dt, tz_h, lat, lon, ayanamsa=ayan)
    cusps, _ = compute_cusps(dt, tz_h, lat, lon, hsys=hs)
    chalit = chalit_from_longitudes(p, cusps)
    data = compute_bhava_bala(p, chalit)
    payload = {"bhava_bala": data, "chart_id": cid or chart_id_for(dob, tob, tz, lat, lon, ayan, hs)}
    cache_set(key, payload)
    return jsonify(payload)


@api.get("/arudha")
def arudha():
    try:
        dob, tob, tz, lat, lon, ayan, hs, cid = parse_query_or_id()
    except ValueError as e:
        return _json_error(str(e), code=400)
    init_swe()
    key = f"arudha|{cid}" if cid else f"arudha|{dob}|{tob}|{tz}|{lat:.6f}|{lon:.6f}|{ayan}|{hs}"
    if (hit := cache_get(key)) is not None:
        return jsonify(hit)
    try:
        from astrology.planets import compute_planets
        from astrology.houses import compute_cusps
        from astrology.charts import chalit_from_longitudes
        from astrology.arudha import compute_arudha
    except Exception:
        return _json_error("arudha not available", code=501, type_="missing_dependency")
    tz_h = _tz_hours(tz); dt = datetime.fromisoformat(f"{dob}T{tob}:00")
    p = compute_planets(dt, tz_h, lat, lon, ayanamsa=ayan)
    cusps, _ = compute_cusps(dt, tz_h, lat, lon, hsys=hs)
    chalit = chalit_from_longitudes(p, cusps)
    asc_idx = sign_index(cusps[0]) if isinstance(cusps,(list,tuple)) and len(cusps)>0 else 0
    data = compute_arudha(p, asc_idx, chalit)
    payload = {"arudha": data, "chart_id": cid or chart_id_for(dob, tob, tz, lat, lon, ayan, hs)}
    cache_set(key, payload)
    return jsonify(payload)


@api.get("/kp")
def kp():
    try:
        dob, tob, tz, lat, lon, ayan, hs, cid = parse_query_or_id()
    except ValueError as e:
        return _json_error(str(e), code=400)
    init_swe()
    key = f"kp|{cid}" if cid else f"kp|{dob}|{tob}|{tz}|{lat:.6f}|{lon:.6f}|{ayan}|{hs}"
    if (hit := cache_get(key)) is not None:
        return jsonify(hit)
    try:
        from astrology.planets import compute_planets
        from astrology.houses import compute_cusps
        from astrology.kp import compute_kp_significators
    except Exception:
        return _json_error("kp not available", code=501, type_="missing_dependency")
    tz_h = _tz_hours(tz); dt = datetime.fromisoformat(f"{dob}T{tob}:00")
    p = compute_planets(dt, tz_h, lat, lon, ayanamsa=ayan)
    cusps, _ = compute_cusps(dt, tz_h, lat, lon, hsys=hs)
    data = compute_kp_significators(p, cusps)
    payload = {"kp": data, "chart_id": cid or chart_id_for(dob, tob, tz, lat, lon, ayan, hs)}
    cache_set(key, payload)
    return jsonify(payload)


# ===================== NEW ENDPOINTS =====================

@api.get("/grahas")
def grahas():
    """
    Normalized graha details for UI:
      - lon/retro/speed
      - sign_idx + sign name
      - nakshatra_idx + name + pada
      - house number (from chalit, when available)
      - lords: sign, nakshatra, and house_lordship[] (whole-sign houses this graha rules)
    """
    try:
        dob, tob, tz, lat, lon, ayan, hs, _cid = parse_query_or_id()
    except ValueError as e:
        return _json_error(str(e), code=400)

    init_swe()
    key = f"grahas|{dob}|{tob}|{tz}|{lat:.6f}|{lon:.6f}|{ayan}|{hs}"
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

    planets = compute_planets(dt, tz_h, lat, lon, ayanamsa=ayan)
    cusps, asc_lon = compute_cusps(dt, tz_h, lat, lon, hsys=hs)
    asc_idx = sign_index(asc_lon)

    # chalit → to derive house number per planet
    house_by_planet = {}
    try:
        chalit = chalit_from_longitudes(planets, cusps)  # 12 buckets of planet names
        for i, bucket in enumerate(chalit, start=1):
            for name in bucket:
                house_by_planet[name] = i
    except Exception:
        pass

    def _sign_idx_from_lon(lon_deg: float) -> int:
        return int((lon_deg % 360.0) // 30.0)

    def _nak_pada_from_lon(lon_deg: float):
        span = 360.0 / 27.0  # 13°20'
        pada_span = span / 4.0  # 3°20'
        d = lon_deg % 360.0
        nak_idx = int(d // span)
        pada = int(((d % span) // pada_span)) + 1
        return nak_idx, pada

    # whole-sign house → sign index list (H1..H12)
    house_sign_idx = [(asc_idx + (h - 1)) % 12 for h in range(1, 13)]

    # lord helpers (fallback to functions if symbol arrays not present)
    sign_lord_fn = _imp_first([
        ("astrology.lords", "sign_lord"),
        ("astrology.lords", "get_sign_lord"),
    ])
    nak_lord_fn = _imp_first([
        ("astrology.lords", "nakshatra_lord"),
        ("astrology.lords", "get_nakshatra_lord"),
    ])

    out = {}
    for pname, pdata in planets.items():
        lon_deg = float(pdata.get("lon", 0.0))
        retro = bool(pdata.get("retrograde"))
        speed = pdata.get("speed")

        sidx = _sign_idx_from_lon(lon_deg)
        sname = SIGN_NAMES[sidx] if SIGN_NAMES and 0 <= sidx < len(SIGN_NAMES) else None

        nidx, pada = _nak_pada_from_lon(lon_deg)
        nname = NAKSHATRA_NAMES[nidx] if NAKSHATRA_NAMES and 0 <= nidx < len(NAKSHATRA_NAMES) else None

        # lords
        if SIGN_LORDS and 0 <= sidx < len(SIGN_LORDS):
            sign_lord = SIGN_LORDS[sidx]
        elif sign_lord_fn:
            try:
                sign_lord = sign_lord_fn(sidx)
            except Exception:
                sign_lord = None
        else:
            sign_lord = None

        if NAKSHATRA_LORDS and 0 <= nidx < len(NAKSHATRA_LORDS):
            nak_lord = NAKSHATRA_LORDS[nidx]
        elif nak_lord_fn:
            try:
                nak_lord = nak_lord_fn(nidx)
            except Exception:
                nak_lord = None
        else:
            nak_lord = None

        # house lordship (whole-sign): houses whose signs are ruled by this graha
        houses_ruled = []
        lord_name = (pname or "").strip()
        if lord_name:
            for h, sign_idx_for_house in enumerate(house_sign_idx, start=1):
                hs_sign_lord = None
                if SIGN_LORDS and 0 <= sign_idx_for_house < len(SIGN_LORDS):
                    hs_sign_lord = SIGN_LORDS[sign_idx_for_house]
                elif sign_lord_fn:
                    try:
                        hs_sign_lord = sign_lord_fn(sign_idx_for_house)
                    except Exception:
                        hs_sign_lord = None
                if hs_sign_lord and str(hs_sign_lord).lower() == lord_name.lower():
                    houses_ruled.append(h)

        out[pname] = {
            "lon": lon_deg,
            "retrograde": retro,
            "speed": speed,
            "sign_idx": sidx,
            "sign": sname,
            "nakshatra_idx": nidx,
            "nakshatra": nname,
            "pada": pada,
            "house": house_by_planet.get(pname),
            "lords": {
                "sign": sign_lord,
                "nakshatra": nak_lord,
                "house_lordship": houses_ruled or None,
            },
        }

    payload = {
        "grahas": out,
        "chart_id": chart_id_for(dob, tob, tz, lat, lon, ayan, hs),
    }
    cache_set(key, payload)
    return jsonify(payload)


@api.get("/varsha/details")
def varsha_details():
    """
    Varshaphal subfeatures:
      - muntha
      - sahams
      - mudda_dasha
      - annual: {yogas, aspects}
    Defaults varsha_year to request's local (tz) year + 1 when absent.
    Tries compute_varshaphala() first; if a piece is missing, tries tolerant per-feature imports.
    """
    try:
        dob, tob, tz, lat, lon, ayan, hs, _cid = parse_query_or_id()
    except ValueError as e:
        return _json_error(str(e), code=400)

    init_swe()

    tz_h = _tz_hours(tz)
    local_now = datetime.utcnow() + timedelta(hours=tz_h)
    varsha_year = request.args.get("varsha_year", type=int)
    varsha_year = varsha_year if varsha_year is not None else (local_now.year + 1)

    key = f"varsha_details|{varsha_year}|{dob}|{tob}|{tz}|{lat:.6f}|{lon:.6f}|{ayan}|{hs}"
    if (hit := cache_get(key)) is not None:
        return jsonify(hit)

    try:
        from astrology.varshaphala import compute_varshaphala
    except Exception:
        return _json_error("astrology varshaphala not available", code=501, type_="missing_dependency")

    dt = datetime.fromisoformat(f"{dob}T{tob}:00")
    v = None
    try:
        v = compute_varshaphala(dt, tz_h, lat, lon, varsha_year=int(varsha_year))
    except Exception as e:
        app.logger.warning("compute_varshaphala failed: %s", e)

    # extract if present
    muntha = v.get("muntha") if isinstance(v, dict) else None
    sahams = v.get("sahams") if isinstance(v, dict) else None
    mudda = v.get("mudda_dasha") or (v.get("mudda") if isinstance(v, dict) else None)
    annual_yogas = (v.get("yogas") if isinstance(v, dict) else None) or None
    annual_aspects = (v.get("aspects") if isinstance(v, dict) else None) or None

    # tolerant fallbacks
    if muntha is None:
        fn = _imp_first([
            ("astrology.varshaphala", "compute_muntha"),
            ("astrology.varshaphala", "muntha"),
        ])
        if fn:
            try:
                muntha = fn(dt, tz_h, lat, lon, int(varsha_year))
            except Exception:
                muntha = None

    if sahams is None:
        fn = _imp_first([
            ("astrology.varshaphala", "compute_sahams"),
            ("astrology.varshaphala", "sahams"),
        ])
        if fn:
            try:
                sahams = fn(dt, tz_h, lat, lon, int(varsha_year))
            except Exception:
                sahams = None

    if mudda is None:
        fn = _imp_first([
            ("astrology.varshaphala", "compute_mudda_dasha"),
            ("astrology.varshaphala", "compute_tajika_dasha"),
            ("astrology.varshaphala", "mudda_dasha"),
        ])
        if fn:
            try:
                mudda = fn(dt, tz_h, lat, lon, int(varsha_year))
            except Exception:
                mudda = None

    if annual_yogas is None:
        fn = _imp_first([
            ("astrology.varshaphala", "compute_annual_yogas"),
            ("astrology.yogas", "compute_annual_yogas"),
        ])
        if fn:
            try:
                annual_yogas = fn(dt, tz_h, lat, lon, int(varsha_year))
            except Exception:
                annual_yogas = None

    if annual_aspects is None:
        fn = _imp_first([
            ("astrology.varshaphala", "compute_annual_aspects"),
            ("astrology.aspects", "compute_annual_aspects"),
        ])
        if fn:
            try:
                annual_aspects = fn(dt, tz_h, lat, lon, int(varsha_year))
            except Exception:
                annual_aspects = None

    payload = {
        "varsha_year": int(varsha_year),
        "muntha": muntha,
        "sahams": sahams,
        "mudda_dasha": mudda,
        "annual": {
            "yogas": annual_yogas,
            "aspects": annual_aspects,
        },
        "chart_id": chart_id_for(dob, tob, tz, lat, lon, ayan, hs),
    }
    cache_set(key, payload)
    return jsonify(payload)

@api.get("/acg/cities")
def acg_cities():
    """
    ACG hits (planet+angle) and optional relocation advice for 100 major cities.
    Query:
      - chart params or chart_id
      - limit (int, default=3): top hits per city
      - max_km (float, default=400): include hits within this distance
      - relocation (bool, default=false): include relocation score/summary
    """
    try:
        dob, tob, tz, lat, lon, ayan, hs, cid = parse_query_or_id()
    except ValueError as e:
        return jsonify({"error": {"type": "bad_request", "message": str(e)}}), 400

    try:
        top_k = int(request.args.get("limit", "3"))
        max_km = float(request.args.get("max_km", "400"))
        want_reloc = request.args.get("relocation", "false").lower() in ("1","true","yes","y")
    except Exception:
        top_k, max_km, want_reloc = 3, 400.0, False

    init_swe()
    cache_key = f"acg_cities|{dob}|{tob}|{tz}|{ayan}|{hs}|{top_k}|{max_km}|{int(want_reloc)}"
    cached = cache_get(cache_key)
    if cached is not None:
        return jsonify(cached)

    dt = datetime.fromisoformat(f"{dob}T{tob}:00")
    tz_h = _tz_hours(tz)

    cities = compute_acg_cities(
        dt, tz_h,
        top_k=top_k,
        max_km=max_km,
        relocation=want_reloc,
    )

    payload = {
        "cities": cities,
        "chart_id": cid or chart_id_for(dob, tob, tz, lat, lon, ayan, hs),
    }
    cache_set(cache_key, payload, timeout=600)
    return jsonify(payload)

