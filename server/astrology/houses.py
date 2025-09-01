import swisseph as swe
from .swe_utils import to_julian_day, norm360

# House systems: 'P' Placidus, 'W' Whole Sign etc.

def compute_cusps(dt_local, tz_offset, lat, lon, hsys='P'):
    jd = to_julian_day(dt_local, tz_offset)
    # tropical cusps are typical for Bhava Chalit alignment with popular sites
    cusps, ascmc = swe.houses_ex(jd, lat, lon, hsys.encode('ascii'))
    cusps = [norm360(c) for c in cusps]
    asc_tropical = ascmc[0]
    # Convert Asc to sidereal for Rashi chart
    ayan = swe.get_ayanamsa(jd)
    asc_sidereal = norm360(asc_tropical - ayan)
    return cusps, asc_sidereal


def which_house_from_cusps(lon_tropical: float, cusps: list[float]) -> int:
    for i in range(12):
        start = cusps[i]
        end = cusps[(i + 1) % 12]
        if start <= end:
            in_house = (lon_tropical >= start) and (lon_tropical < end)
        else:
            in_house = (lon_tropical >= start) or (lon_tropical < end)
        if in_house:
            return i + 1
    return 12