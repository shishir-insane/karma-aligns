# backend/services/acg_cities.py
from __future__ import annotations
from math import radians, sin, cos, asin, sqrt
from typing import Iterable, Tuple, List, Dict, Any
from datetime import datetime

from backend.data.cities_top import TOP_CITIES
from astrology.astrocartography import compute_astrocartography

# --- Heuristics / weights (edit to taste) ---
_PLANET_WEIGHT = {
    "Jupiter": 1.00, "Sun": 0.92, "Venus": 0.90, "Moon": 0.78,
    "Mercury": 0.72, "Mars": 0.62, "Saturn": 0.58, "Rahu": 0.65, "Ketu": 0.60,
}
_ANGLE_WEIGHT = {"ASC": 1.00, "MC": 0.95, "DSC": 0.85, "IC": 0.80}

_PLANET_THEMES = {
    "Jupiter": "growth, opportunity, learning",
    "Sun": "visibility, leadership, confidence",
    "Venus": "relationships, harmony, art/luxury",
    "Moon": "home, wellbeing, emotional balance",
    "Mercury": "communication, trade, study",
    "Mars": "drive, competition, courage",
    "Saturn": "structure, discipline, long-term work",
    "Rahu": "innovation, foreign exposure, risk-taking",
    "Ketu": "introspection, research, detachment",
}
_ANGLE_THEMES = {
    "ASC": "identity & lifestyle",
    "MC": "career & public life",
    "DSC": "partnerships & networks",
    "IC": "home & family",
}

def _iter_points(obj) -> Iterable[Tuple[float, float]]:
    """Yield (lat, lon) from nested dict/list payloads."""
    if obj is None:
        return
    if isinstance(obj, dict):
        if "lat" in obj and "lon" in obj:
            yield float(obj["lat"]), float(obj["lon"])
        else:
            for v in obj.values():
                yield from _iter_points(v)
    elif isinstance(obj, (list, tuple)):
        if len(obj) >= 2 and all(isinstance(x, (int, float)) for x in obj[:2]):
            yield float(obj[0]), float(obj[1])
        else:
            for x in obj:
                yield from _iter_points(x)

def _haversine_km(lat1, lon1, lat2, lon2) -> float:
    R = 6371.009
    a1, b1, a2, b2 = map(radians, [lat1, lon1, lat2, lon2])
    dlat = a2 - a1
    dlon = b2 - b1
    h = sin(dlat/2)**2 + cos(a1)*cos(a2)*sin(dlon/2)**2
    return 2 * R * asin(sqrt(h))

def _theme_for_hit(planet: str, angle: str) -> str:
    p = _PLANET_THEMES.get(planet, "mixed influences")
    a = _ANGLE_THEMES.get(angle, "life areas")
    return f"{p}; {a}"

def _strength(distance_km: float, planet: str, angle: str, max_km: float) -> float:
    # distance fades linearly to zero at max_km
    dw = max(0.0, 1.0 - (distance_km / max_km))
    return 100.0 * dw * _PLANET_WEIGHT.get(planet, 0.6) * _ANGLE_WEIGHT.get(angle, 0.8)

def _compose_relocation(hits: List[dict], max_km: float) -> dict:
    """Build relocation summary/score from nearest hits."""
    if not hits:
        return {"score": 0.0, "summary": "No strong ACG lines nearby.", "themes": [], "suggestions": [], "top_hits": []}

    enriched = []
    for h in hits:
        planet, angle, d = h["planet"], h["angle"], float(h["distance_km"])
        enriched.append({
            **h,
            "strength": round(_strength(d, planet, angle, max_km), 1),
            "theme": _theme_for_hit(planet, angle),
        })

    enriched.sort(key=lambda x: x["strength"], reverse=True)
    top3 = enriched[:3]
    avg_score = round(sum(x["strength"] for x in top3) / max(1, len(top3)), 1)

    themes = [
        {
            "planet": x["planet"],
            "angle": x["angle"],
            "domain": _ANGLE_THEMES.get(x["angle"], ""),
            "tone": _PLANET_THEMES.get(x["planet"], ""),
        }
        for x in top3
    ]
    bullets = [f"{x['planet']} {x['angle']} (~{x['distance_km']} km): {x['theme']}" for x in top3]
    lead = top3[0] if top3 else None
    lead_sentence = (
        f"Strongest vibe: {lead['planet']} {lead['angle']} ({int(lead['distance_km'])} km) → {lead['theme']}."
        if lead else "No standout ACG influence detected."
    )
    summary = f"{lead_sentence} Overall relocation potential score: {avg_score:.0f}/100."

    return {"score": avg_score, "summary": summary, "themes": themes, "suggestions": bullets, "top_hits": top3}

def compute_acg_cities(
    dt_local: datetime,
    tz_hours: float,
    *,
    top_k: int = 3,
    max_km: float = 400.0,
    relocation: bool = False,
) -> List[Dict[str, Any]]:
    """
    Pure service: given a datetime & tz offset, compute ACG lines once,
    then score 100 cities for nearest planet/angle lines.
    Assumes Swiss Ephemeris has been initialized by the caller.
    """
    acg = compute_astrocartography(dt_local, tz_hours)  # {"lines": {...}, "advice": {...}}
    lines = (acg or {}).get("lines", {})
    advice_by_planet = (acg or {}).get("advice", {})

    # build (planet, angle) -> list of points
    catalog: List[Tuple[str, str, List[Tuple[float, float]]]] = []
    if isinstance(lines, dict):
        for planet, angles in lines.items():
            if not isinstance(angles, dict):
                continue
            for angle, payload in angles.items():
                pts = list(_iter_points(payload))
                if pts:
                    catalog.append((str(planet), str(angle), pts))

    results: List[Dict[str, Any]] = []
    for city in TOP_CITIES:
        clat, clon = city["lat"], city["lon"]
        hits: List[Dict[str, Any]] = []
        for planet, angle, pts in catalog:
            dmin = min((_haversine_km(clat, clon, plat, plon) for (plat, plon) in pts), default=1e9)
            if dmin <= max_km:
                hits.append({
                    "planet": planet,
                    "angle": angle,
                    "distance_km": round(dmin, 1),
                    "advice": advice_by_planet.get(planet),  # optional
                })
        hits.sort(key=lambda x: x["distance_km"])
        item: Dict[str, Any] = {
            "key": city["key"], "name": city["name"], "country": city["country"],
            "lat": clat, "lon": clon,
            "hits": hits[:max(1, top_k)],
        }
        if relocation:
            item["relocation"] = _compose_relocation(hits[:max(5, top_k)], max_km)
        results.append(item)

    return results
