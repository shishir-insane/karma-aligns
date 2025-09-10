# tests/test_vimshottari.py
import datetime as dt
from predictions.core.vimshottari import full_vimshottari

def test_vimshottari_monotonic():
    birth = dt.datetime(1984,9,24,12,tzinfo=dt.timezone.utc)
    moon = 120.0
    periods = full_vimshottari(moon, birth, depth=3)
    prev = periods[0].start
    for p in periods:
        assert p.start >= prev
        assert p.end > p.start
        prev = p.end
