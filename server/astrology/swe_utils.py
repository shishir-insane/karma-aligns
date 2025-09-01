# astrology/swe_utils.py
"""
Swiss Ephemeris utilities and one-time initialization.

- init(ephe_path, ayanamsa): call once to set eph path & sidereal mode.
- to_julian_day: safe wrapper that accounts for tz offset.
- sign utilities: norm360, sign_index.

No side-effects on import to keep startup deterministic.
"""

from __future__ import annotations

import os
import math
from datetime import datetime, timedelta
from threading import RLock
import swisseph as swe

# Map friendly name -> Swiss Eph ayanamsa code
AYANAMSA_MAP = {
    "lahiri":        swe.SIDM_LAHIRI,
    "fagan":         swe.SIDM_FAGAN_BRADLEY,
    "krishnamurti":  swe.SIDM_KRISHNAMURTI,
}

# Internal state (thread-safe)
_swe_lock = RLock()
_initialized = False
_ephe_path: str | None = None
_ayanamsa_name: str = "lahiri"


def init(ephe_path: str | None = None, ayanamsa: str = "lahiri") -> None:
    """
    Initialize Swiss Ephemeris settings once. Safe to call multiple times
    with the same values; changes are applied if values differ.
    """
    global _initialized, _ephe_path, _ayanamsa_name

    # Normalize inputs
    ephe_path = (ephe_path or "").strip() or None
    ayan = (ayanamsa or "lahiri").lower()

    with _swe_lock:
        # Apply ephemeris path if provided
        if ephe_path and ephe_path != _ephe_path:
            swe.set_ephe_path(ephe_path)
            _ephe_path = ephe_path

        # Apply sidereal mode
        mode = AYANAMSA_MAP.get(ayan, swe.SIDM_LAHIRI)
        swe.set_sid_mode(mode)
        _ayanamsa_name = ayan
        _initialized = True


def get_config() -> dict:
    """Return current Swiss Ephemeris config (for debugging/ready checks)."""
    return {
        "initialized": _initialized,
        "ephe_path": _ephe_path,
        "ayanamsa": _ayanamsa_name,
    }


def to_julian_day(dt_local: datetime, tz_offset_hours: float) -> float:
    """
    Convert local wall-time + tz offset (hours) to Swiss Ephemeris Julian day.
    """
    dt_utc = dt_local - timedelta(hours=tz_offset_hours)
    # Swiss expects fractional hours
    frac_hour = dt_utc.hour + dt_utc.minute / 60.0 + dt_utc.second / 3600.0
    with _swe_lock:
        return swe.julday(dt_utc.year, dt_utc.month, dt_utc.day, frac_hour)


def set_sidereal(ayanamsa: str = "lahiri") -> None:
    """Convenience setter for sidereal mode."""
    init(_ephe_path, ayanamsa)  # reuse init to keep state consistent


def norm360(x: float) -> float:
    return x % 360.0


def sign_index(lon: float) -> int:
    """0 = Aries, ... 11 = Pisces"""
    return int(math.floor(norm360(lon) / 30.0))
