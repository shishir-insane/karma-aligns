from .swe_utils import sign_index
from .houses import which_house_from_cusps as which_house_from_cusps_approx

PLANET_SHORT = {
    'Sun': 'Su', 'Moon': 'Mo', 'Mars': 'Ma', 'Mercury': 'Me', 'Jupiter': 'Ju', 'Venus': 'Ve', 'Saturn': 'Sa',
    'Uranus': 'Ur', 'Neptune': 'Ne', 'Pluto': 'Pl', 'Rahu': 'Ra', 'Ketu': 'Ke'
}

def short_label(name: str) -> str:
    return PLANET_SHORT.get(name, name[:2])

# Rāshi (Whole Sign) chart: map planets to sign houses from Asc sign

def rashi_from_longitudes(planets: dict, asc_idx: int):
    houses = [[] for _ in range(12)]
    for name, data in planets.items():
        if name == 'Ketu':
            continue
        sidx = sign_index(data['lon'])
        h = ((sidx - asc_idx) % 12) + 1
        houses[h - 1].append(name)   # ← full name
    return houses

def chalit_from_longitudes(planets: dict, cusps: list[float]):
    houses = [[] for _ in range(12)]
    for name, data in planets.items():
        if name == 'Ketu':
            continue
        h = which_house_from_cusps_approx(data['lon'], cusps)
        houses[h - 1].append(name)   # ← full name
    return houses
