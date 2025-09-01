# backend/api/common.py
from __future__ import annotations
from hashlib import sha256
from typing import Tuple, Optional, Any, Dict
from flask import request
from flask import current_app as app

# ---------- Normalization / ID ----------

def normalize_inputs(
    dob: str, tob: str, tz: str, lat: float, lon: float,
    ayanamsa: str = "lahiri", hsys: str = "P"
) -> Tuple[str, str, str, float, float, str, str]:
    """
    Return canonicalized inputs: tz trimmed, ayanamsa lowercased, lat/lon as float.
    """
    tz = (tz or "+00:00").strip()
    return dob, tob, tz, float(lat), float(lon), ayanamsa.lower(), hsys

def chart_id_for(
    dob: str, tob: str, tz: str, lat: float, lon: float,
    ayan: str = "lahiri", hs: str = "P"
) -> str:
    """
    Stable, deterministic ID for a chart input tuple.
    """
    dob, tob, tz, lat, lon, ayan, hs = normalize_inputs(dob, tob, tz, lat, lon, ayan, hs)
    key = f"{dob}|{tob}|{tz}|{lat:.6f}|{lon:.6f}|{ayan}|{hs}"
    return sha256(key.encode()).hexdigest()

# ---------- Swiss Ephemeris bootstrap ----------

def init_swe() -> None:
    """
    Idempotent Swiss Ephemeris initialization using Flask config.
    Reads EPHE_PATH and SIDEREAL_AYANAMSA from app.config.
    """
    from astrology import swe_utils as su
    su.init(
        ephe_path=app.config.get("EPHE_PATH"),
        ayanamsa=app.config.get("SIDEREAL_AYANAMSA", "lahiri"),
    )

# ---------- Cache helpers (Flask-Caching) ----------

def get_cache():
    """
    Return a Flask-Caching Cache instance if available.
    Supports either a direct Cache object at app.extensions['cache'] or
    a dict of caches under that key.
    """
    ext = app.extensions.get("cache")
    if hasattr(ext, "get") and hasattr(ext, "set"):
        return ext
    if isinstance(ext, dict):
        for v in ext.values():
            if hasattr(v, "get") and hasattr(v, "set"):
                return v
    return None

def cache_get(key: str):
    c = get_cache()
    if not c:
        return None
    try:
        return c.get(key)
    except Exception:
        return None

def cache_set(key: str, value: Any, timeout: int = 600) -> None:
    c = get_cache()
    if not c:
        return
    try:
        c.set(key, value, timeout=timeout)
    except Exception:
        pass

# ---------- chart_id ↔ inputs mapping ----------

def _cache_key_inputs(cid: str) -> str:
    return f"chart_inputs|{cid}"

def set_chart_inputs(
    cid: str, dob: str, tob: str, tz: str,
    lat: float, lon: float, ayan: str = "lahiri", hs: str = "P",
    ttl: int = 3600
) -> None:
    """
    Persist the inputs for a given chart_id so lightweight endpoints
    can be called with ?chart_id=... only.
    """
    c = get_cache()
    if not c:
        return
    try:
        c.set(_cache_key_inputs(cid), {
            "dob": dob, "tob": tob, "tz": tz,
            "lat": float(lat), "lon": float(lon),
            "ayanamsa": ayan, "hsys": hs,
        }, timeout=ttl)
    except Exception:
        pass

def get_chart_inputs(cid: str) -> Optional[Dict[str, Any]]:
    c = get_cache()
    if not c:
        return None
    try:
        return c.get(_cache_key_inputs(cid))
    except Exception:
        return None

# ---------- Query parsing (supports chart_id) ----------

def parse_query_or_id() -> Tuple[str, str, str, float, float, str, str, Optional[str]]:
    """
    Resolve inputs from either explicit query params or a chart_id.

    Returns: (dob, tob, tz, lat, lon, ayan, hs, chart_id or None)

    Behavior:
      - If ?chart_id=... is provided, resolve its inputs from cache.
        If unknown, and full inputs are also present in query, seed the mapping and continue.
        If unknown and inputs are missing → raise ValueError.
      - If no chart_id, parse required inputs from query.
    """
    cid = request.args.get("chart_id")
    if cid:
        m = get_chart_inputs(cid)
        if m:
            dob = m["dob"]; tob = m["tob"]; tz = m["tz"]
            lat = float(m["lat"]); lon = float(m["lon"])
            ayan = m.get("ayanamsa", "lahiri"); hs = m.get("hsys", "P")
            return normalize_inputs(dob, tob, tz, lat, lon, ayan, hs) + (cid,)
        # Fallback: allow seeding on the fly if inputs are supplied with chart_id
        try:
            dob = request.args["dob"]; tob = request.args["tob"]
            tz  = request.args.get("tz", "+00:00")
            lat = float(request.args["lat"]); lon = float(request.args["lon"])
            ayan = request.args.get("ayanamsa", "lahiri"); hs = request.args.get("hsys", "P")
            dob, tob, tz, lat, lon, ayan, hs = normalize_inputs(dob, tob, tz, lat, lon, ayan, hs)
            set_chart_inputs(cid, dob, tob, tz, lat, lon, ayan, hs)
            return dob, tob, tz, lat, lon, ayan, hs, cid
        except KeyError:
            raise ValueError("unknown chart_id; seed it via /api/v1/chart/id with inputs, or pass inputs directly")

    # No chart_id → parse required inputs
    try:
        dob = request.args["dob"]; tob = request.args["tob"]
        tz  = request.args.get("tz", "+00:00")
        lat = float(request.args["lat"]); lon = float(request.args["lon"])
        ayan = request.args.get("ayanamsa", "lahiri"); hs = request.args.get("hsys", "P")
    except KeyError as e:
        raise ValueError(f"missing query param: {e.args[0]}")
    return normalize_inputs(dob, tob, tz, lat, lon, ayan, hs) + (None,)
