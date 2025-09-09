# astrology/panchanga.py
from __future__ import annotations
from datetime import datetime, timedelta
from .planets import compute_planets
from .nakshatra import nakshatra_for_lon
from .swe_utils import norm360

# 30 tithis
TITHI_NAMES = [
    "Pratipada","Dvitiya","Tritiya","Chaturthi","Panchami","Shashthi","Saptami","Ashtami","Navami","Dashami",
    "Ekadashi","Dwadashi","Trayodashi","Chaturdashi","Purnima",
    "Pratipada","Dvitiya","Tritiya","Chaturthi","Panchami","Shashthi","Saptami","Ashtami","Navami","Dashami",
    "Ekadashi","Dwadashi","Trayodashi","Chaturdashi","Amavasya",
]
# 27 yogas
YOGA_NAMES = [
    "Vishkambha","Priti","Ayushman","Saubhagya","Shobhana","Atiganda","Sukarma","Dhriti","Shoola","Ganda",
    "Vriddhi","Dhruva","Vyaghata","Harshana","Vajra","Siddhi","Vyatipata","Variyan","Parigha","Shiva",
    "Siddha","Sadhya","Shubha","Shukla","Brahma","Indra","Vaidhriti",
]
# 60 karanas (standard sequence)
KARANA_NAMES = [
    "Bava","Balava","Kaulava","Taitila","Garaja","Vanija","Vishti",  # repeats in half-tithi cycles
] * 8 + ["Shakuni","Chatushpada","Naga","Kimstughna"]

WEEKDAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]

def compute_panchanga(dt_local: datetime, tz_hours: float, lat: float, lon: float) -> dict:
    """
    Fast, sidereal panchanga summary:
      - tithi (index/name/progress)
      - nakshatra (index/name/pada/progress)
      - yoga (index/name/progress)
      - karana (index/name)
      - weekday (local)
    Simplifications: traditional sunrise-based day boundaries are not used here; we compute at given dt_local.
    """
    # planets in sidereal (your swe_utils.init() should already be called by API)
    p = compute_planets(dt_local, tz_hours, lat, lon)

    sun = p["Sun"]["lon"]
    moon = p["Moon"]["lon"]

    # Tithi
    diff = norm360(moon - sun)  # 0..360
    tithi_float = diff / 12.0
    tithi_idx = int(tithi_float) % 30
    tithi_progress = tithi_float - int(tithi_float)

    # Yoga (sum of longitudes)
    yoga_float = norm360(moon + sun) / (360.0 / 27.0)
    yoga_idx = int(yoga_float) % 27
    yoga_progress = yoga_float - int(yoga_float)

    # Karana (half tithi)
    karana_idx = int(diff / 6.0) % 60
    karana = KARANA_NAMES[karana_idx]

    # Nakshatra
    nidx, nname, lord, pada = nakshatra_for_lon(moon)  

    # Weekday in local time
    local_day = (dt_local - timedelta(hours=0)).weekday()  # dt_local is already local wall time
    weekday = WEEKDAYS[local_day]

    return {
        "tithi": {"idx": tithi_idx, "name": TITHI_NAMES[tithi_idx], "progress": round(tithi_progress, 4)},
        "yoga": {"idx": yoga_idx, "name": YOGA_NAMES[yoga_idx], "progress": round(yoga_progress, 4)},
        "karana": {"idx": karana_idx, "name": karana},
        "nakshatra": {"idx": nidx, "name": nname, "pada": int(pada), "lird": lord},
        "weekday": weekday,
    }
