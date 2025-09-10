# tests/test_transits.py
import datetime as dt
from predictions.core.transits import find_transit_aspects
from predictions.core.ephemeris import ApproxEphemerisProvider

def test_transit_finder_runs():
    eph = ApproxEphemerisProvider()
    natal = {"SUN": 100.0}
    start = dt.datetime(2025,1,1,tzinfo=dt.timezone.utc)
    end = start + dt.timedelta(days=5)
    events = find_transit_aspects(eph, natal, movers=["MARS"], targets=["SUN"], start=start, end=end, step_minutes=120)
    assert isinstance(events, list)
