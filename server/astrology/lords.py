# astrology/lords.py
from __future__ import annotations
from .symbols import SIGN_LORDS
from .nakshatra import NAKSHATRA_LORDS

def sign_lord(sign_idx: int) -> str:
    return str(SIGN_LORDS[sign_idx % 12])

def nakshatra_lord(nak_idx: int) -> str:
    return str(NAKSHATRA_LORDS[nak_idx % 27])
