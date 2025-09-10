# core/vimshottari.py
from __future__ import annotations
from dataclasses import dataclass
import datetime as dt
from typing import List, Tuple

NAK_LEN = 13 + 20/60  # 13°20'
SEQUENCE = ["KETU","VENUS","SUN","MOON","MARS","RAHU","JUPITER","SATURN","MERCURY"]
YEARS = {"KETU":7,"VENUS":20,"SUN":6,"MOON":10,"MARS":7,"RAHU":18,"JUPITER":16,"SATURN":19,"MERCURY":17}

@dataclass
class Period:
    lord: str
    start: dt.datetime
    end: dt.datetime
    level: int  # 1=Maha, 2=Antara, 3=Pratyantar, 4=Sookshma, 5=Praana

def _index_of(lord: str) -> int:
    return SEQUENCE.index(lord)

def _add_years_approx(t: dt.datetime, years: float) -> dt.datetime:
    # 1 year = 365.2425 days (mean tropical year)
    days = years * 365.2425
    return t + dt.timedelta(days=days)

def _nak_ruler(moon_lon: float) -> str:
    idx = int((moon_lon % 360.0) // NAK_LEN) % 27
    # Dasha lord repeats every 9 nakshatras: map 27 to 9-sequence
    return SEQUENCE[idx % 9]

def _nak_fraction(moon_lon: float) -> float:
    pos_in_nak = (moon_lon % NAK_LEN)
    return pos_in_nak / NAK_LEN  # 0..1 progressed

def compute_mahadasha_start(moon_lon: float, birth_utc: dt.datetime) -> Tuple[List[Period], int]:
    lord = _nak_ruler(moon_lon)
    progressed = _nak_fraction(moon_lon)       # elapsed fraction
    remaining = 1.0 - progressed               # balance to run at birth
    start = birth_utc
    mdur = YEARS[lord] * remaining
    first_end = _add_years_approx(start, mdur)
    maha: List[Period] = [Period(lord, start, first_end, level=1)]
    # continue the chain to cover 120 years window from birth
    cursor = first_end
    i = (_index_of(lord)+1) % 9
    total_added = YEARS[lord]*remaining
    while total_added < 120.0 + 0.001:
        L = SEQUENCE[i]
        dur = YEARS[L]
        maha.append(Period(L, cursor, _add_years_approx(cursor, dur), 1))
        total_added += dur
        cursor = maha[-1].end
        i = (i+1) % 9
    return maha, _index_of(lord)

def subdivide(parent: Period, seq=SEQUENCE, years=YEARS, level=2) -> List[Period]:
    out: List[Period] = []
    cursor = parent.start
    for L in seq:
        frac = years[L] / years[parent.lord]
        dur_years = (parent.end - parent.start).total_seconds()/86400.0 / 365.2425 * frac
        end = _add_years_approx(cursor, dur_years)
        out.append(Period(L, cursor, end, level))
        cursor = end
    return out

def full_vimshottari(moon_lon: float, birth_utc: dt.datetime, depth: int = 3) -> List[Period]:
    maha, _ = compute_mahadasha_start(moon_lon, birth_utc)
    periods = []
    for m in maha:
        periods.append(m)
        if depth >= 2:
            antara = subdivide(m, level=2)
            periods.extend(antara)
            if depth >= 3:
                for a in antara:
                    praty = subdivide(a, level=3)
                    periods.extend(praty)
    return periods
