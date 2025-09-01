from .symbols import SIGN_NAMES, PLANET_SYMBOLS
from .swe_utils import sign_index
from .nakshatra import nakshatra_for_lon

SIGN_LORDS = {
    'Aries':'Mars','Taurus':'Venus','Gemini':'Mercury','Cancer':'Moon','Leo':'Sun','Virgo':'Mercury',
    'Libra':'Venus','Scorpio':'Mars','Sagittarius':'Jupiter','Capricorn':'Saturn','Aquarius':'Saturn','Pisces':'Jupiter'
}

def build_planet_table(planets: dict, asc_idx: int, *, include_asc: dict | None = None):
    """
    include_asc: optional dict like {"lon": <asc_sidereal_deg>, "label": "Ascendant"}
    """
    rows = []

    # Optional Ascendant row (first)
    if include_asc:
        asc_lon = include_asc["lon"]
        asc_sign = SIGN_NAMES[sign_index(asc_lon)]
        asc_deg = f"{asc_lon % 30:.2f}°"
        nak, lord, pada = nakshatra_for_lon(asc_lon)
        rows.append({
            'Symbols': 'Asc',              # or '' if you prefer
            'Planets': include_asc.get("label","Ascendant"),
            'Retrograde': False,
            'Sign': asc_sign,
            'Sign Lord': SIGN_LORDS[asc_sign],
            'Degree': asc_deg,
            'Nakshatra': nak,
            'Nakshatra Lord': lord,
            'Nakshatra Pada': pada,
            'House': 1,                    # Lagna is House 1
        })

    # Planets
    for name, data in planets.items():
        lon = data['lon']
        sign = SIGN_NAMES[sign_index(lon)]
        deg = f"{lon % 30:.2f}°"
        nak, lord, pada = nakshatra_for_lon(lon)
        house_num = ((sign_index(lon) - asc_idx) % 12) + 1  # 1..12

        rows.append({
            'Symbols': PLANET_SYMBOLS.get(name, ''),
            'Planets': name,
            'Retrograde': data.get('retro', False),
            'Sign': sign,
            'Sign Lord': SIGN_LORDS[sign],
            'Degree': deg,
            'Nakshatra': nak,
            'Nakshatra Lord': lord,
            'Nakshatra Pada': pada,
            'House': house_num,
        })

    return rows
