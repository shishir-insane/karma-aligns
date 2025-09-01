# astrology/nakshatra.py

NAKSHATRAS = [
    "Ashwini","Bharani","Krittika","Rohini","Mrigashirsha","Ardra","Punarvasu","Pushya","Ashlesha",
    "Magha","Purva Phalguni","Uttara Phalguni","Hasta","Chitra","Swati","Vishakha","Anuradha","Jyeshtha",
    "Mula","Purva Ashadha","Uttara Ashadha","Shravana","Dhanishta","Shatabhisha","Purva Bhadrapada","Uttara Bhadrapada","Revati"
]

# Vimshottari Dasha Lords in order of nakshatras
NAKSHATRA_LORDS = [
    "Ketu","Venus","Sun","Moon","Mars","Rahu","Jupiter","Saturn","Mercury",
    "Ketu","Venus","Sun","Moon","Mars","Rahu","Jupiter","Saturn","Mercury",
    "Ketu","Venus","Sun","Moon","Mars","Rahu","Jupiter","Saturn","Mercury"
]

def get_nakshatra_index(lon: float) -> int:
    """Return 0..26 index of nakshatra for given sidereal longitude."""
    return int((lon % 360.0) // (360.0 / 27))

def get_pada(lon: float) -> int:
    """
    Returns pada (1..4) of nakshatra for given longitude.
    Each pada is 3°20′ (3.333°).
    """
    deg_in_nak = (lon % (360.0 / 27))   # longitude within this nakshatra span
    pada = int(deg_in_nak // (360.0 / (27*4))) + 1
    return pada

def get_nakshatra_name(lon: float) -> str:
    idx = get_nakshatra_index(lon)
    return NAKSHATRAS[idx]

def get_nakshatra_lord(lon_or_name) -> str:
    """Accept longitude (float) or nakshatra name (str)."""
    if isinstance(lon_or_name, (float,int)):
        idx = get_nakshatra_index(lon_or_name)
    else:
        try:
            idx = NAKSHATRAS.index(lon_or_name)
        except ValueError:
            return "-"
    return NAKSHATRA_LORDS[idx]

def nakshatra_for_lon(lon: float):
    """
    Returns (nakshatra_name, lord, pada) for a given longitude.
    Example: (\"Ashwini\", \"Ketu\", 2)
    """
    idx = get_nakshatra_index(lon)
    name = NAKSHATRAS[idx]
    lord = NAKSHATRA_LORDS[idx]
    pada = get_pada(lon)
    return name, lord, pada
