# core/transits.py
from __future__ import annotations
import datetime as dt
from dataclasses import dataclass
from typing import Dict, List, Tuple, Iterable, Optional, Literal, Callable
from core.ephemeris import BaseEphemeris, GeoPoint

EventType = Literal["conjunction","opposition","trine","sextile","square","ingress","return","aspect_hit"]

ASPECT_DEGS = {
    "conjunction": 0.0,
    "sextile": 60.0,
    "square": 90.0,
    "trine": 120.0,
    "opposition": 180.0,
}

@dataclass
class TransitEvent:
    when: dt.datetime
    mover: str
    target: str
    event: EventType
    exact_delta: float  # deg error at solution (abs)
    meta: Dict

def _angle_delta(a: float, b: float) -> float:
    # signed shortest delta a->b in degrees (-180..+180)
    d = (b - a + 180.0) % 360.0 - 180.0
    return d

def _wrap(a: float) -> float:
    return a % 360.0

def _refine_time(f: Callable[[dt.datetime], float], t1: dt.datetime, t2: dt.datetime, tol_sec=30) -> Tuple[dt.datetime, float]:
    # Binary search for zero crossing of f(t) in [t1,t2]; assumes sign change
    v1, v2 = f(t1), f(t2)
    if v1 == 0: return t1, 0.0
    if v2 == 0: return t2, 0.0
    lo, hi = (t1, t2) if v1 < 0 else (t2, t1)
    while (hi - lo).total_seconds() > tol_sec:
        mid = lo + (hi - lo)/2
        vm = f(mid)
        if vm == 0:
            return mid, 0.0
        if vm < 0:
            lo = mid
        else:
            hi = mid
    mid = lo + (hi - lo)/2
    return mid, abs(f(mid))

def moving_longitude(eph: BaseEphemeris, mover: str, when: dt.datetime, geo: Optional[GeoPoint], ayanamsa: str) -> float:
    return eph.planet_longitude(when, mover, geo, ayanamsa).lon

def static_longitude(natal_points: Dict[str, float], point: str) -> float:
    return natal_points[point]

def _event_function(eph: BaseEphemeris, mover: str, target_lon: float, aspect_deg: float, geo: Optional[GeoPoint], ayanamsa: str):
    def f(t: dt.datetime) -> float:
        mv = moving_longitude(eph, mover, t, geo, ayanamsa)
        delta = _angle_delta(_wrap(mv - target_lon), aspect_deg)
        # We want root at delta == 0; return signed delta
        return delta
    return f

def find_transit_aspects(
    eph: BaseEphemeris,
    natal_points: Dict[str, float],
    movers: Iterable[str],
    targets: Iterable[str],
    start: dt.datetime,
    end: dt.datetime,
    step_minutes: int = 60,
    orb_deg: float = 1.0,
    ayanamsa: str = "lahiri",
    geo: Optional[GeoPoint] = None
) -> List[TransitEvent]:
    """
    Brute-sample + refine. Emits events when a mover planet hits configured aspects to natal targets.
    """
    events: List[TransitEvent] = []
    aspects = ASPECT_DEGS.items()
    t = start
    # Precompute target longs
    target_lon = {tgt: _wrap(natal_points[tgt]) for tgt in targets}
    prev_vals: Dict[Tuple[str,str,str], Tuple[dt.datetime, float]] = {}
    while t <= end:
        for mover in movers:
            mv = moving_longitude(eph, mover, t, geo, ayanamsa)
            for tgt, lon_t in target_lon.items():
                for name, deg in aspects:
                    key = (mover, tgt, name)
                    val = _angle_delta(_wrap(mv - lon_t), deg)
                    # detect zero crossing within +/- orb window
                    prev = prev_vals.get(key)
                    if prev is not None:
                        t_prev, v_prev = prev
                        # If sign changed and the segment likely passes |val|<=orb, refine
                        if (v_prev <= 0 < val) or (v_prev >= 0 > val):
                            f = _event_function(eph, mover, lon_t, deg, geo, ayanamsa)
                            when, err = _refine_time(f, t_prev, t)
                            if abs(err) <= orb_deg:
                                events.append(TransitEvent(when, mover, tgt, name, abs(err), {"orb": orb_deg}))
                    prev_vals[key] = (t, val)
        t = t + dt.timedelta(minutes=step_minutes)
    # sort chronologically
    events.sort(key=lambda e: e.when)
    return events

def find_ingresses(
    eph: BaseEphemeris,
    movers: Iterable[str],
    start: dt.datetime,
    end: dt.datetime,
    step_minutes: int = 30,
    ayanamsa: str = "lahiri",
    geo: Optional[GeoPoint] = None
) -> List[TransitEvent]:
    """
    Emits events when a mover changes sign (ingress).
    """
    events: List[TransitEvent] = []
    last_sign: Dict[str, int] = {}
    def sign_idx(lon: float) -> int: return int(_wrap(lon)//30)
    t = start
    while t <= end:
        for mover in movers:
            lon = moving_longitude(eph, mover, t, geo, ayanamsa)
            s = sign_idx(lon)
            if mover in last_sign and s != last_sign[mover]:
                # refine ingress time by binary search on sign boundary
                def f(tt: dt.datetime) -> float:
                    return sign_idx(moving_longitude(eph, mover, tt, geo, ayanamsa)) - s
                # walk back one step
                t_prev = t - dt.timedelta(minutes=step_minutes)
                when, err = _refine_time(lambda tm: 0.5 if sign_idx(moving_longitude(eph, mover, tm, geo, ayanamsa))==s else -0.5, t_prev, t, 10)
                events.append(TransitEvent(when, mover, f"SIGN_{s}", "ingress", err, {"sign": s}))
            last_sign[mover] = s
        t += dt.timedelta(minutes=step_minutes)
    events.sort(key=lambda e: e.when)
    return events
