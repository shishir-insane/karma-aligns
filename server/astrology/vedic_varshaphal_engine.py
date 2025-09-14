
import json
import math
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Any, Tuple, Optional

# Dependency handling
try:
    import swisseph as swe
except Exception as e:
    raise ImportError(
        "This module requires the 'pyswisseph' package (swisseph) and Swiss Ephemeris data files.\n"
        "Install via: pip install pyswisseph\n"
        "And set the ephemeris path to your downloaded Swiss Ephemeris data (SE*.se1, etc.)."
    ) from e


# ----------------------------- Utilities & Constants -----------------------------

ZODIAC_SIGNS = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
]

NAKSHATRAS = [
    ("Ashwini", "Ketu"), ("Bharani", "Venus"), ("Krittika", "Sun"),
    ("Rohini", "Moon"), ("Mrigashira", "Mars"), ("Ardra", "Rahu"),
    ("Punarvasu", "Jupiter"), ("Pushya", "Saturn"), ("Ashlesha", "Mercury"),
    ("Magha", "Ketu"), ("Purva Phalguni", "Venus"), ("Uttara Phalguni", "Sun"),
    ("Hasta", "Moon"), ("Chitra", "Mars"), ("Swati", "Rahu"),
    ("Vishakha", "Jupiter"), ("Anuradha", "Saturn"), ("Jyeshtha", "Mercury"),
    ("Mula", "Ketu"), ("Purva Ashadha", "Venus"), ("Uttara Ashadha", "Sun"),
    ("Shravana", "Moon"), ("Dhanishta", "Mars"), ("Shatabhisha", "Rahu"),
    ("Purva Bhadrapada", "Jupiter"), ("Uttara Bhadrapada", "Saturn"), ("Revati", "Mercury"),
]

# Planet list we'll compute (Vedic 9 + outers for context)
PLANETS = {
    "Sun": swe.SE_SUN,
    "Moon": swe.SE_MOON,
    "Mars": swe.SE_MARS,
    "Mercury": swe.SE_MERCURY,
    "Jupiter": swe.SE_JUPITER,
    "Venus": swe.SE_VENUS,
    "Saturn": swe.SE_SATURN,
    "Rahu": swe.SE_MEAN_NODE,   # mean node as commonly used
    "Ketu": -swe.SE_MEAN_NODE,  # computed by 180° from Rahu
    "Uranus": swe.SE_URANUS,
    "Neptune": swe.SE_NEPTUNE,
    "Pluto": swe.SE_PLUTO,
}

# Exaltation / Debilitation signs (sidereal)
EXALTATION = {
    "Sun": "Aries",
    "Moon": "Taurus",
    "Mars": "Capricorn",
    "Mercury": "Virgo",
    "Jupiter": "Cancer",
    "Venus": "Pisces",
    "Saturn": "Libra",
}
DEBILITATION = {
    "Sun": "Libra",
    "Moon": "Scorpio",
    "Mars": "Cancer",
    "Mercury": "Pisces",
    "Jupiter": "Capricorn",
    "Venus": "Virgo",
    "Saturn": "Aries",
}

# Sign lords (sidereal)
SIGN_LORD = {
    "Aries": "Mars", "Taurus": "Venus", "Gemini": "Mercury", "Cancer": "Moon",
    "Leo": "Sun", "Virgo": "Mercury", "Libra": "Venus", "Scorpio": "Mars",
    "Sagittarius": "Jupiter", "Capricorn": "Saturn", "Aquarius": "Saturn", "Pisces": "Jupiter"
}

# Combustion orbs (approximate, degrees)
COMBUSTION_ORB = {
    "Moon": 12, "Mars": 17, "Mercury": 12, "Jupiter": 11, "Venus": 10, "Saturn": 15
}

# House categories
KENDRA = {1, 4, 7, 10}
TRIKONA = {1, 5, 9}
DUSTHANA = {6, 8, 12}
UPACHAYA = {3, 6, 10, 11}

# Flags for Swiss Ephemeris
IFLAG_SIDEREAL = swe.SEFLG_SWIEPH | swe.SEFLG_SIDEREAL | swe.SEFLG_SPEED

# ----------------------------- Data Models -----------------------------

@dataclass
class PlanetPosition:
    name: str
    longitude: float
    latitude: float
    speed_long: float
    sign: str
    sign_degree: float
    nakshatra: str
    nakshatra_lord: str
    retrograde: bool
    house: int
    dignity: str
    combust: bool

@dataclass
class HouseCusp:
    number: int
    longitude: float
    sign: str

@dataclass
class Aspect:
    from_planet: str
    to_planet: str
    type: str
    exact_diff: float

# ----------------------------- Helper Functions -----------------------------

def dms_angle(angle: float) -> Tuple[int, int, float]:
    a = angle % 360.0
    deg = int(a)
    mins_full = (a - deg) * 60
    mins = int(mins_full)
    secs = (mins_full - mins) * 60
    return deg, mins, secs

def sign_of(longitude: float) -> str:
    idx = int((longitude % 360) // 30)
    return ZODIAC_SIGNS[idx]

def sign_degree(longitude: float) -> float:
    return (longitude % 30.0)

def nakshatra_of(longitude: float) -> Tuple[str, str, int, float]:
    length = 13.3333333333
    idx = int((longitude % 360) // length)
    name, lord = NAKSHATRAS[idx]
    start = idx * length
    offset = (longitude % 360) - start
    return name, lord, idx+1, offset

def normalize_angle(angle: float) -> float:
    return angle % 360.0

def angle_diff(a: float, b: float) -> float:
    d = (a - b + 180) % 360 - 180
    return d

def parse_tz_offset(tz_str: str) -> timezone:
    sign = 1 if tz_str.startswith("+") else -1
    parts = tz_str[1:].split(":")
    hours = int(parts[0])
    mins = int(parts[1]) if len(parts) > 1 else 0
    return timezone(timedelta(hours=sign*hours, minutes=sign*mins))

def set_sidereal_lahiri():
    swe.set_sid_mode(swe.SIDM_LAHIRI, 0, 0)

def set_ephe_path(path: Optional[str] = None):
    swe.set_ephe_path(path or ".")

def jd_from_datetime(dt_utc: datetime) -> float:
    return swe.julday(dt_utc.year, dt_utc.month, dt_utc.day,
                      dt_utc.hour + dt_utc.minute/60 + dt_utc.second/3600)

def datetime_from_jd(jd_ut: float) -> datetime:
    y, m, d, h = swe.revjul(jd_ut)
    hour = int(h)
    minute = int((h - hour) * 60)
    second = int(round((((h - hour) * 60) - minute) * 60))
    return datetime(y, m, d, hour, minute, second, tzinfo=timezone.utc)

def is_combust(sun_long: float, planet_long: float, planet_name: str) -> bool:
    if planet_name not in COMBUSTION_ORB:
        return False
    orb = COMBUSTION_ORB[planet_name]
    return abs(angle_diff(planet_long, sun_long)) <= orb

def planet_dignity(planet: str, sign: str) -> str:
    if planet in EXALTATION and EXALTATION[planet] == sign:
        return "Exalted"
    if planet in DEBILITATION and DEBILITATION[planet] == sign:
        return "Debilitated"
    if SIGN_LORD.get(sign) == planet:
        return "Own Sign"
    if planet == "Sun" and sign == "Leo":
        return "Moolatrikona"
    if planet == "Moon" and sign == "Taurus":
        return "Moolatrikona"
    if planet == "Mars" and sign == "Aries":
        return "Moolatrikona"
    if planet == "Mercury" and sign == "Virgo":
        return "Moolatrikona"
    if planet == "Jupiter" and sign == "Sagittarius":
        return "Moolatrikona"
    if planet == "Venus" and sign == "Libra":
        return "Moolatrikona"
    if planet == "Saturn" and sign == "Aquarius":
        return "Moolatrikona"
    return "Neutral"

def house_score_category(house: int) -> int:
    if house in DUSTHANA:
        return -2
    if house in TRIKONA and house != 1:
        return 2
    if house in KENDRA:
        return 1
    if house in UPACHAYA:
        return 1
    return 0

def dignity_score(dignity: str) -> int:
    return {
        "Exalted": 2,
        "Own Sign": 1,
        "Moolatrikona": 1,
        "Debilitated": -2,
        "Neutral": 0
    }.get(dignity, 0)

def retrograde_score(retro: bool) -> int:
    return 0

def combustion_score(combust: bool) -> int:
    return -1 if combust else 0

def effect_to_scale(total: int) -> int:
    return max(-5, min(5, total))

# ----------------------------- Core Computations -----------------------------

def compute_planet_positions(jd_ut: float, lat: float, lon: float) -> Dict[str, "PlanetPosition"]:
    set_sidereal_lahiri()
    positions: Dict[str, PlanetPosition] = {}

    sun_pos = swe.calc_ut(jd_ut, PLANETS["Sun"], IFLAG_SIDEREAL)[0]
    sun_long = normalize_angle(sun_pos[0])

    for name, p_id in PLANETS.items():
        if name == "Ketu":
            rahu = swe.calc_ut(jd_ut, PLANETS["Rahu"], IFLAG_SIDEREAL)[0]
            lon_ = normalize_angle(rahu[0] + 180.0)
            lat_ = -rahu[1]
            spd_ = -rahu[3]
        else:
            res = swe.calc_ut(jd_ut, p_id, IFLAG_SIDEREAL)[0]
            lon_ = normalize_angle(res[0])
            lat_ = res[1]
            spd_ = res[3]

        sgn = sign_of(lon_)
        sdeg = sign_degree(lon_)
        nname, nlord, _, _ = nakshatra_of(lon_)
        retro = spd_ < 0
        dign = planet_dignity(name, sgn)
        comb = is_combust(sun_long, lon_, name)

        positions[name] = PlanetPosition(
            name=name, longitude=lon_, latitude=lat_, speed_long=spd_,
            sign=sgn, sign_degree=sdeg, nakshatra=nname, nakshatra_lord=nlord,
            retrograde=retro, house=0, dignity=dign, combust=comb
        )
    return positions

def compute_houses(jd_ut: float, lat: float, lon: float) -> Tuple[List["HouseCusp"], float]:
    set_sidereal_lahiri()
    try:
        cusps, ascmc = swe.houses_ex(jd_ut, lat, lon, b'P', IFLAG_SIDEREAL)
        asc = (ascmc[0]) % 360.0
        houses = []
        for i in range(1, 13):
            cusp = (cusps[i]) % 360.0
            houses.append(HouseCusp(number=i, longitude=cusp, sign=sign_of(cusp)))
        return houses, asc
    except Exception:
        ascmc = swe.houses_ex(jd_ut, lat, lon, b'P', IFLAG_SIDEREAL)[1]
        asc = (ascmc[0]) % 360.0
        asc_sign_index = int((asc // 30))
        houses = []
        for i in range(12):
            cusp = ((asc_sign_index + i) * 30.0) % 360.0
            houses.append(HouseCusp(number=i+1, longitude=cusp, sign=ZODIAC_SIGNS[(asc_sign_index + i) % 12]))
        return houses, asc

def assign_planets_to_houses(planets: Dict[str, "PlanetPosition"], houses: List["HouseCusp"]) -> None:
    edges = [h.longitude for h in houses] + [houses[0].longitude + 360.0]
    for p in planets.values():
        lon = p.longitude % 360.0
        house_found = 1
        for i in range(12):
            a = edges[i] % 360.0
            b = edges[i+1] % 360.0
            if a <= b:
                inside = (lon >= a) and (lon < b)
            else:
                inside = (lon >= a) or (lon < b)
            if inside:
                house_found = i + 1
                break
        p.house = house_found

def graha_drishti_aspects(planets: Dict[str, "PlanetPosition"]) -> List["Aspect"]:
    aspects: List[Aspect] = []
    for a_name, a in planets.items():
        for b_name, b in planets.items():
            if a_name == b_name:
                continue
            diff = (b.longitude - a.longitude) % 360.0
            if abs(diff - 180) <= 5:
                aspects.append(Aspect(a_name, b_name, "7th", ((b.longitude - a.longitude + 180) % 360) - 180))
            if a_name == "Mars":
                for angle, typ in [(120, "4th"), (240, "8th")]:
                    if abs(diff - angle) <= 5:
                        aspects.append(Aspect(a_name, b_name, typ, ((b.longitude - a.longitude + 180) % 360) - 180))
            if a_name == "Jupiter":
                for angle, typ in [(150, "5th"), (210, "9th")]:
                    if abs(diff - angle) <= 5:
                        aspects.append(Aspect(a_name, b_name, typ, ((b.longitude - a.longitude + 180) % 360) - 180))
            if a_name == "Saturn":
                for angle, typ in [(90, "3rd"), (240, "10th")]:
                    if abs(diff - angle) <= 5:
                        aspects.append(Aspect(a_name, b_name, typ, ((b.longitude - a.longitude + 180) % 360) - 180))
    return aspects

# ----------------------------- Solar Return Computation -----------------------------

def find_solar_return_jd(natal_jd_ut: float, target_year: int, tz: timezone, lat: float, lon: float) -> float:
    set_sidereal_lahiri()
    natal_sun_long = (swe.calc_ut(natal_jd_ut, swe.SE_SUN, IFLAG_SIDEREAL)[0][0]) % 360.0

    y, m, d, h = swe.revjul(natal_jd_ut)
    approx_local = datetime(target_year, m, d, int(h), int((h - int(h))*60), tzinfo=tz)
    approx_utc = approx_local.astimezone(timezone.utc)
    guess_jd = swe.julday(approx_utc.year, approx_utc.month, approx_utc.day,
                          approx_utc.hour + approx_utc.minute/60 + approx_utc.second/3600)

    def f(jd):
        cur = (swe.calc_ut(jd, swe.SE_SUN, IFLAG_SIDEREAL)[0][0]) % 360.0
        d = (cur - natal_sun_long + 180) % 360 - 180
        return d

    left = guess_jd - 2.0
    right = guess_jd + 2.0
    f_left = f(left)
    f_right = f(right)

    expand = 0
    while f_left * f_right > 0 and expand < 5:
        expand += 1
        left -= 2.0
        right += 2.0
        f_left = f(left)
        f_right = f(right)

    for _ in range(80):
        mid = 0.5 * (left + right)
        fm = f(mid)
        if abs(fm) < 1e-5:
            return mid
        if f_left * fm < 0:
            right = mid
            f_right = fm
        else:
            left = mid
            f_left = fm
    return 0.5 * (left + right)

# ----------------------------- Interpretation Engine -----------------------------

def _area_impacts_for_planet(planet: "PlanetPosition") -> List[str]:
    mapping = {
        "Sun": ["career", "authority", "health"],
        "Moon": ["mind", "home", "emotions"],
        "Mars": ["energy", "conflict", "courage"],
        "Mercury": ["communication", "learning", "trade"],
        "Jupiter": ["finance", "wisdom", "children"],
        "Venus": ["relationships", "comforts", "creativity"],
        "Saturn": ["discipline", "longevity", "work"],
        "Rahu": ["ambition", "innovation", "foreign"],
        "Ketu": ["detachment", "spirituality", "loss"],
        "Uranus": ["sudden-change", "technology"],
        "Neptune": ["ideals", "confusion"],
        "Pluto": ["transformation", "power"]
    }
    return mapping.get(planet.name, ["general"])

def _compose_planet_interpretation(p: "PlanetPosition") -> Tuple[str, List[Dict[str, Any]], int]:
    score = house_score_category(p.house) + dignity_score(p.dignity) + retrograde_score(p.retrograde) + combustion_score(p.combust)
    score = effect_to_scale(score)

    tone = []
    tone.append(f"{p.name} in {p.sign} (House {p.house}) indicates a noticeable emphasis where your efforts naturally gravitate this year.")
    if p.dignity in ("Exalted", "Own Sign", "Moolatrikona"):
        tone.append(f"{p.name} enjoys {p.dignity.lower()} strength here—expect smoother expression of its qualities.")
    elif p.dignity == "Debilitated":
        tone.append(f"{p.name} is debilitated, calling for patience and corrective remedies before results mature.")
    if p.retrograde:
        tone.append(f"{p.name} is retrograde, making themes more introspective and karmically revisited.")
    if p.combust:
        tone.append(f"{p.name} is combust—avoid overexertion; keep humility and steadiness.")

    areas = _area_impacts_for_planet(p)
    area_scores = [{"area": a, "effect": score} for a in areas]

    text = " ".join(tone)
    return text, area_scores, score

def _compose_aspect_interpretation(a: "Aspect") -> Tuple[str, List[Dict[str, Any]], int]:
    base = 0
    if a.from_planet in {"Jupiter", "Venus"}:
        base += 1
    if a.from_planet in {"Saturn", "Mars", "Rahu", "Ketu"}:
        base -= 1
    if a.type == "7th":
        base += 0
    elif a.type in {"5th", "9th"}:
        base += 1
    elif a.type in {"3rd", "4th", "8th", "10th"}:
        base -= 1
    score = effect_to_scale(base)
    text = f"{a.from_planet} casts a {a.type} drishti on {a.to_planet}, weaving a prominent connection between their significations."
    areas = [{"area": "relationships" if a.type == "7th" else "general", "effect": score}]
    return text, areas, score

def synthesize_interpretations(planets: Dict[str, "PlanetPosition"], aspects: List["Aspect"]) -> List[Dict[str, Any]]:
    interpretations: List[Dict[str, Any]] = []

    for p in planets.values():
        if p.name in {"Uranus", "Neptune", "Pluto"}:
            continue
        text, areas, score = _compose_planet_interpretation(p)
        interpretations.append({
            "title": f"{p.name} in {p.sign} (House {p.house})",
            "justification": text,
            "areas": areas,
            "score": score
        })

    for a in aspects:
        if a.from_planet in {"Uranus", "Neptune", "Pluto"} or a.to_planet in {"Uranus", "Neptune", "Pluto"}:
            continue
        text, areas, score = _compose_aspect_interpretation(a)
        interpretations.append({
            "title": f"{a.from_planet} → {a.to_planet} ({a.type} drishti)",
            "justification": text,
            "areas": areas,
            "score": score
        })

    sun = planets["Sun"]
    moon = planets["Moon"]
    if sun.house in TRIKONA:
        interpretations.append({
            "title": "Solar Vitality in Dharma Trikona",
            "justification": "Sun in a trinal house elevates purpose, leadership, and moral clarity—align actions with inner conviction.",
            "areas": [{"area": "career", "effect": 2}, {"area": "health", "effect": 1}],
            "score": 3
        })
    if moon.house in DUSTHANA:
        interpretations.append({
            "title": "Emotional Hygiene Required",
            "justification": "Moon in a dusthana can stir subconscious residue; steady routines and nourishing company restore balance.",
            "areas": [{"area": "mind", "effect": -2}, {"area": "home", "effect": -1}],
            "score": -2
        })
    return interpretations

# ----------------------------- Monthly Timeline -----------------------------

def monthly_timeline(sr_start_jd: float, planets_sr: Dict[str, "PlanetPosition"], houses: List["HouseCusp"]) -> List[Dict[str, Any]]:
    start_dt = datetime_from_jd(sr_start_jd)
    sun_house = planets_sr["Sun"].house
    timeline = []
    for m in range(12):
        month_start = start_dt + timedelta(days=30 * m)
        month_end = month_start + timedelta(days=30)
        focus_house = ((sun_house - 1 + m) % 12) + 1
        theme = ""
        if focus_house in {1, 5, 9}:
            theme = "Purpose, education, and self-alignment take center stage."
        elif focus_house in {2, 11}:
            theme = "Finance and gains receive focus—invest with prudence."
        elif focus_house in {3, 6, 10}:
            theme = "Effort, discipline, and career foundations are emphasized."
        elif focus_house in {4, 7}:
            theme = "Home and relationships need attention—seek mutual understanding."
        elif focus_house in {8, 12}:
            theme = "Introspection and transformation—mindful routines safeguard energy."
        else:
            theme = "Creativity and growth through consistent practice."
        timeline.append({
            "month": m + 1,
            "start_utc": month_start.replace(tzinfo=timezone.utc).isoformat(),
            "end_utc": month_end.replace(tzinfo=timezone.utc).isoformat(),
            "focus_house": focus_house,
            "highlights": [theme]
        })
    return timeline

# ----------------------------- API Orchestration -----------------------------

def generate_varshaphal_prediction_api(
    dob: str, tob: str, tz: str, lat: float, lon: float, varsha_year: int,
    ephe_path: Optional[str] = None
) -> Dict[str, Any]:
    """
    Generate a comprehensive Vedic Varshaphal interpretation JSON.
    - dob: 'YYYY-MM-DD'
    - tob: 'HH:MM:SS' (24h)
    - tz:  '+05:30' style offset
    - lat, lon: decimal degrees (North/East positive; West/South negative)
    - varsha_year: target solar return year
    - ephe_path: custom Swiss Ephemeris files path (optional)
    """
    set_ephe_path(ephe_path)
    set_sidereal_lahiri()

    tzinfo = parse_tz_offset(tz)
    birth_local = datetime.strptime(f"{dob} {tob}", "%Y-%m-%d %H:%M:%S").replace(tzinfo=tzinfo)
    birth_utc = birth_local.astimezone(timezone.utc)
    natal_jd = jd_from_datetime(birth_utc)

    sr_jd = find_solar_return_jd(natal_jd, varsha_year, tzinfo, lat, lon)

    planets = compute_planet_positions(sr_jd, lat, lon)
    houses, asc = compute_houses(sr_jd, lat, lon)
    assign_planets_to_houses(planets, houses)
    aspects = graha_drishti_aspects(planets)

    interpretations = synthesize_interpretations(planets, aspects)
    months = monthly_timeline(sr_jd, planets, houses)

    planets_json = [asdict(p) for p in planets.values()]
    houses_json = [asdict(h) for h in houses]
    aspects_json = [asdict(a) for a in aspects]
    meta = {
        "ayanamsa": "Lahiri",
        "calculation_flags": {
            "sidereal": True,
            "mean_node": True,
            "house_system": "Placidus (fallback to Whole Sign)"
        }
    }

    payload = {
        "meta": meta,
        "inputs": {
            "dob": dob,
            "tob": tob,
            "tz": tz,
            "latitude": lat,
            "longitude": lon,
            "varsha_year": varsha_year
        },
        "solar_return": {
            "datetime_utc": datetime_from_jd(sr_jd).isoformat(),
            "jd_ut": sr_jd,
            "location": {"lat": lat, "lon": lon},
            "ascendant_longitude": asc,
            "chart": {
                "planets": planets_json,
                "houses": houses_json,
                "aspects": aspects_json
            }
        },
        "interpretations": interpretations,
        "monthly_timeline": months
    }

    return payload


if __name__ == "__main__":
    sample = generate_varshaphal_prediction_api(
        dob="1984-09-24",
        tob="17:30:00",
        tz="+05:30",
        lat=26.7606,
        lon=83.3732,
        varsha_year=2026,
        ephe_path=None
    )
    print(json.dumps(sample, indent=2))
