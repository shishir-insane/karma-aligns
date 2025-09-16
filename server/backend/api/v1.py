"""
backend/api/v1.py — Versioned API endpoints

Exposes:
- GET  /api/v1/health     : quick service ping
- POST /api/v1/compute    : returns a comprehensive astrology payload (JSON)

Design notes:
- Input validation with Pydantic → consistent 400s for bad input.
- Caching is optional (handled in parts.py for small endpoints).
- Swiss Eph config comes from config.py via swe_utils.init().
- Missing optional modules never 500; they are skipped gracefully.
"""

from __future__ import annotations
from typing import Any, Dict, List
from datetime import datetime, timedelta

from flask import request, jsonify
from flask import current_app as app, g  # logging + config + extensions
from pydantic import BaseModel, ValidationError, field_validator

from . import api

# --------- Input model ---------
class ComputeRequest(BaseModel):
    """Schema for /compute input payload."""
    name: str | None = "Chart"
    dob: str
    tob: str
    tz: str = "+00:00"
    lat: float
    lon: float
    varsha_year: int | None = None
    vargas: List[str] | None = None

    @field_validator("lat")
    @classmethod
    def _lat(cls, v: float) -> float:
        if not -90.0 <= v <= 90.0:
            raise ValueError("lat out of range [-90, 90]")
        return v

    @field_validator("lon")
    @classmethod
    def _lon(cls, v: float) -> float:
        if not -180.0 <= v <= 180.0:
            raise ValueError("lon out of range [-180, 180]")
        return v


# --------- Utilities ---------
def _bad_request(msg: str, *, field: str | None = None, extra: dict | None = None):
    payload: Dict[str, Any] = {"error": {"type": "bad_request", "message": msg}}
    if field:
        payload["error"]["field"] = field
    if extra:
        payload["error"]["extra"] = extra
    return jsonify(payload), 400


def _parse_tz_to_hours(tz_str: str | None) -> float:
    s = (tz_str or "").strip()
    if not s:
        return 0.0
    sign = -1.0 if s.startswith("-") else 1.0
    s = s.lstrip("+-")
    if ":" in s:
        hh, mm = s.split(":", 1)
        return sign * (int(hh) + int(mm) / 60.0)
    return sign * float(s)


def _normalize_vargas(v: List[str] | None) -> List[str]:
    if not v:
        return ["D9", "D10"]
    seen, out = set(), []
    for item in (str(x).upper() for x in v):
        if item and item not in seen:
            seen.add(item)
            out.append(item)
    return out


# --------- Endpoints ---------
@api.get("/health")
def health():
    """Simple service ping."""
    app.logger.info("health ping reqid=%s", getattr(g, "reqid", "-"))
    return jsonify({"ok": True, "service": "sage-astro-api", "version": "1.0.0"})


@api.post("/compute")
def compute():
    """
    Compute a comprehensive kundli payload.

    Request JSON (see OpenAPI for full schema):
    {
      "name": "Chart",
      "dob": "1984-09-24",
      "tob": "17:30",
      "tz": "+05:30",
      "lat": 26.7606,
      "lon": 83.3732,
      "vargas": ["D9", "D10"],
      "varsha_year": 2027
    }
    """
    # ---- Validate input with Pydantic ----
    try:
        req = ComputeRequest.model_validate(request.get_json(force=True))
    except ValidationError as e:
        return jsonify({
            "error": {"type": "validation", "status": 400, "message": "Bad input", "detail": e.errors()}
        }), 400

    app.logger.info(
        "compute start reqid=%s lat=%.6f lon=%.6f dob=%s tob=%s tz=%s",
        getattr(g, "reqid", "-"), req.lat, req.lon, req.dob, req.tob, req.tz
    )

    # ---- Swiss Ephemeris init from config ----
    try:
        from astrology import swe_utils as su
        su.init(ephe_path=app.config.get("EPHE_PATH"),
                ayanamsa=app.config.get("SIDEREAL_AYANAMSA", "lahiri"))
    except Exception as e:
        app.logger.exception("Swiss Ephemeris init failed")
        return jsonify({"error": {
            "type": "missing_dependency",
            "message": "astrology/swiss ephemeris not initialized",
            "detail": str(e)
        }}), 501

    # ---- Core engine imports (strict, will 501 if missing) ----
    try:
        from astrology.planets import compute_planets
        from astrology.houses import compute_cusps
        from astrology.charts import rashi_from_longitudes, chalit_from_longitudes
        from astrology.vargas import compute_vargas
        from astrology.symbols import SIGN_NAMES, SIGN_SYMBOLS
        from astrology.formatting import build_planet_table
        from astrology.swe_utils import sign_index
        from astrology.dasha import (
            compute_vimsottari, compute_yogini, compute_ashtottari, compute_kalachakra
        )
        from astrology.shadbala import compute_shadbala
        from astrology.varshaphala import compute_varshaphala
        from astrology.astrocartography import compute_astrocartography
        from astrology.predictions import generate_predictions
    except Exception as e:
        app.logger.exception("compute import failure")
        return jsonify({
            "error": {
                "type": "missing_dependency",
                "message": "astrology package not importable; ensure modules are on PYTHONPATH",
                "detail": str(e),
            }
        }), 501

    # ---- Core compute ----
    tz_hours = _parse_tz_to_hours(req.tz)
    dt_local = datetime.fromisoformat(f"{req.dob}T{req.tob}:00")

    planets = compute_planets(dt_local, tz_hours, req.lat, req.lon, ayanamsa=app.config.get("SIDEREAL_AYANAMSA","lahiri"))
    cusps, asc_sidereal = compute_cusps(dt_local, tz_hours, req.lat, req.lon, hsys="P")

    asc_idx = sign_index(asc_sidereal)
    rashi_houses  = rashi_from_longitudes(planets, asc_idx)
    chalit_houses = chalit_from_longitudes(planets, cusps)
    varga_maps = compute_vargas(planets, _normalize_vargas(req.vargas))

    # Tables & strengths
    table = build_planet_table(planets, asc_idx)
    shadbala = compute_shadbala(planets, asc_idx, chalit_houses, local_hour=dt_local.hour)

    # Dashas (requires Moon longitude)
    moon_lon = planets.get("Moon", {}).get("lon")
    dasha = None
    dasha = None
    if moon_lon is not None:
        try:
            vim = compute_vimsottari(dt_local, tz_hours, moon_lon)
        except Exception as e:
            vim = {"_error": str(e)}
        try:
            yog = compute_yogini(dt_local, tz_hours, moon_lon)
        except Exception as e:
            yog = {"_error": str(e)}
        try:
            asht = compute_ashtottari(dt_local, tz_hours, moon_lon)
        except Exception as e:
            asht = {"_error": str(e)}
        try:
            kcd = compute_kalachakra(dt_local, tz_hours, moon_lon)
        except Exception as e:
            # prevent 500s; surface the issue in a structured way
            kcd = {"_error": f"kalachakra_failed: {e}"}

        dasha = {
            "Vimshottari": vim,
            "Yogini": yog,
            "Ashtottari": asht,
            "Kalachakra": kcd,
        }

    # if moon_lon is not None:
    #     dasha = {
    #         "Vimshottari": compute_vimsottari(dt_local, tz_hours, moon_lon),
    #         "Yogini":      compute_yogini   (dt_local, tz_hours, moon_lon),
    #         "Ashtottari":  compute_ashtottari(dt_local, tz_hours, moon_lon),
    #         "Kalachakra":  compute_kalachakra(dt_local, tz_hours, moon_lon),
    #     }

    # Optional solar return (Varshaphala)
    varsha, varsha_predictions = None, None

    # "Now" in the same local offset as the request
    local_now = datetime.utcnow() + timedelta(hours=tz_hours)

    # If not provided, default to current local year + 1
    varsha_year = req.varsha_year if req.varsha_year is not None else (local_now.year + 1)

    try:
        varsha = compute_varshaphala(
            dt_local, tz_hours, req.lat, req.lon, year=int(varsha_year)
        )
        if isinstance(varsha, dict):
            varsha_predictions = generate_predictions(
                varsha["planets"],
                varsha["asc_idx"],
                varsha["chalit_houses"],
                vargas={},  # (Tajika doesn’t require vargas; keep empty or compute if you wish)
                dasha_info=None,  # Typically Varṣaphala uses Tajika dashās; keep off here
                strengths=None
        )
    except Exception as e:
        app.logger.warning("varshaphala failed: %s", e)
        
    kundli_predictions = generate_predictions(planets, asc_idx, chalit_houses, varga_maps, dasha, shadbala)

    # Astrocartography
    acg = None
    try:
        acg = compute_astrocartography(dt_local, tz_hours)
    except Exception:
        pass

    # Base payload
    payload: Dict[str, Any] = {
        "name": req.name or "Chart",
        "input": {
            "dob": req.dob, "tob": req.tob, "lat": req.lat, "lon": req.lon, "tz": req.tz
        },
        "asc": {"lon": asc_sidereal, "idx": asc_idx, "sign": SIGN_NAMES[asc_idx]},
        "rashis": SIGN_NAMES,
        "sign_symbols": SIGN_SYMBOLS,
        "table": table,
        "charts": {"rashi": rashi_houses, "chalit": chalit_houses, "vargas": varga_maps},
        "shadbala": shadbala,
        "dasha": dasha,
        "kundli_predictions": kundli_predictions,
        "varsha": varsha,
        "varsha_predictions": varsha_predictions,
        "acg": acg,
    }

    # ---------- Extended calculations (best-effort; skip if missing) ----------
    # Panchanga (tithi, nakshatra, yoga, karana, weekday)
    try:
        from astrology.panchanga import compute_panchanga
        payload["panchanga"] = compute_panchanga(dt_local, tz_hours, req.lat, req.lon)
    except Exception:
        pass

    # Ashtakavarga
    try:
        from astrology.ashtakavarga import compute_ashtakavarga
        payload["ashtakavarga"] = compute_ashtakavarga(planets, asc_idx)
    except Exception:
        pass

    # Yogas catalog
    try:
        from astrology.yogas import compute_yogas
        payload["yogas"] = compute_yogas(planets, asc_idx, chalit_houses)
    except Exception:
        pass

    # Avasthas
    try:
        from astrology.avasthas import compute_avasthas
        payload["avasthas"] = compute_avasthas(planets, asc_idx, chalit_houses)
    except Exception:
        pass

    # Aspects
    try:
        from astrology.aspects import compute_aspects
        payload["aspects"] = compute_aspects(planets, asc_idx, chalit_houses)
    except Exception:
        pass

    # Transits (natal transits on the same timestamp)
    try:
        from astrology.transits import compute_transits
        payload["transits"] = compute_transits(dt_local, tz_hours, req.lat, req.lon, planets)
    except Exception:
        pass

    # Arudha / special lagnas
    try:
        from astrology.arudha import compute_arudha
        payload["arudha"] = compute_arudha(planets, asc_idx, chalit_houses)
    except Exception:
        pass

    # Upagrahas / special points
    try:
        from astrology.upagrahas import compute_upagrahas
        payload["upagrahas"] = compute_upagrahas(dt_local, tz_hours, req.lat, req.lon)
    except Exception:
        pass

    # Bhava bala
    try:
        from astrology.bhava_bala import compute_bhava_bala_enhanced, compute_bhava_bala
        legacy = compute_bhava_bala(planets, chalit_houses)
        payload["bhava_bala"] = compute_bhava_bala_enhanced(legacy, return_scale="both")
    except Exception:
        pass

    # KP significators
    try:
        from astrology.kp import compute_kp_significators
        payload["kp"] = compute_kp_significators(planets, cusps)
    except Exception:
        pass

    # Include a deterministic chart_id for SPA reuse
    try:
        from .common import chart_id_for, set_chart_inputs
        cid = chart_id_for(req.dob, req.tob, req.tz, req.lat, req.lon,
                           app.config.get("SIDEREAL_AYANAMSA","lahiri"), "P")
        payload["chart_id"] = cid
        # seed id→inputs mapping (so small endpoints can use ?chart_id=...)
        set_chart_inputs(cid, req.dob, req.tob, req.tz, req.lat, req.lon,
                         app.config.get("SIDEREAL_AYANAMSA","lahiri"), "P")
    except Exception:
        pass

    app.logger.info("compute done reqid=%s", getattr(g, "reqid", "-"))
    return jsonify(payload)
