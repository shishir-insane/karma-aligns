#!/usr/bin/env bash
set -Eeuo pipefail
trap 'echo "ERROR on line $LINENO"; exit 1' ERR

FORCE=0
[[ "${1:-}" == "--force" || "${1:-}" == "-f" ]] && FORCE=1

writel() { # always consumes heredoc; overwrites if --force or file missing
  local path="$1"
  mkdir -p "$(dirname "$path")"
  if [[ $FORCE -eq 1 || ! -f "$path" ]]; then
    cat > "$path"
    echo "Wrote: $path"
  else
    cat > /dev/null
    echo "Skip (exists): $path"
  fi
}

touch_if_missing() {
  local path="$1"
  if [[ ! -f "$path" ]]; then
    mkdir -p "$(dirname "$path")"
    : > "$path"
    echo "Created empty: $path"
  else
    echo "Skip (exists): $path"
  fi
}

# --- directories & packages ---
mkdir -p backend/api astrology templates static openapi tests infra/nginx
touch_if_missing backend/__init__.py
touch_if_missing backend/api/__init__.py
touch_if_missing astrology/__init__.py
touch_if_missing tests/__init__.py

# --- app.py ---
writel app.py <<'EOF'
import os, sys
from flask import Flask, render_template, jsonify
try:
    from flask_cors import CORS
except Exception:
    CORS = None

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

def create_app():
    app = Flask(__name__)
    if CORS:
        CORS(app, resources={r"/api/*": {"origins": "*"}})

    try:
        from backend.errors import install_error_handlers
        install_error_handlers(app)
    except Exception:
        pass

    from backend.api import api
    app.register_blueprint(api)

    @app.get("/")
    def index():
        try:
            return render_template("index.html")
        except Exception:
            return jsonify({"ok": True, "msg": "Sage Astro API is running. See /api/v1/health."})
    return app

app = create_app()

if __name__ == "__main__":
    app.run(debug=True)
EOF

# --- backend/api/__init__.py ---
writel backend/api/__init__.py <<'EOF'
from flask import Blueprint
api = Blueprint("api", __name__, url_prefix="/api/v1")
from . import v1  # noqa: E402,F401
EOF

# --- backend/api/v1.py ---
writel backend/api/v1.py <<'EOF'
from __future__ import annotations
from flask import request, jsonify
from . import api

def _bad_request(msg: str, *, field: str | None = None, extra: dict | None = None):
    payload = {"error": {"type": "bad_request", "message": msg}}
    if field: payload["error"]["field"] = field
    if extra: payload["error"]["extra"] = extra
    return jsonify(payload), 400

@api.get("/health")
def health():
    return jsonify({"ok": True, "service": "sage-astro-api", "version": "1.0.0"})

def _parse_tz_to_hours(tz_str: str | None) -> float:
    s = (tz_str or "").strip()
    if not s: return 0.0
    sign = -1.0 if s.startswith("-") else 1.0
    s = s.lstrip("+-")
    if ":" in s:
        hh, mm = s.split(":", 1)
        return sign * (int(hh) + int(mm)/60.0)
    return sign * float(s)

@api.post("/compute")
def compute():
    if not request.is_json:
        return _bad_request("Expected JSON body with input fields")
    data = request.get_json(silent=True) or {}
    for f in ("dob", "tob", "lat", "lon"):
        if f not in data:
            return _bad_request("Missing required field", field=f)

    # Lazy import engine; return clean JSON if not present
    try:
        from astrology.planets import compute_planets
        from astrology.houses import compute_cusps
        from astrology.charts import rashi_from_longitudes, chalit_from_longitudes
        from astrology.vargas import compute_vargas
        from astrology.symbols import SIGN_NAMES, SIGN_SYMBOLS
        from astrology.formatting import build_planet_table
        from astrology.swe_utils import sign_index
        from astrology.dasha import compute_vimsottari, compute_yogini, compute_ashtottari, compute_kalachakra
        from astrology.shadbala import compute_shadbala
        from astrology.varshaphala import compute_varshaphala
        from astrology.astrocartography import compute_astrocartography
    except Exception as e:
        return jsonify({"error":{
            "type":"missing_dependency",
            "message":"astrology package not importable; ensure modules are on PYTHONPATH",
            "detail": str(e)
        }}), 501

    name = data.get("name", "Chart")
    dob, tob = str(data["dob"]).strip(), str(data["tob"]).strip()
    lat, lon = float(data["lat"]), float(data["lon"])
    tz_hours = _parse_tz_to_hours(data.get("tz", "+00:00"))
    if not (-90 <= lat <= 90): return _bad_request("lat out of range [-90,90]", field="lat")
    if not (-180 <= lon <= 180): return _bad_request("lon out of range [-180,180]", field="lon")

    from datetime import datetime
    dt_local = datetime.fromisoformat(f"{dob}T{tob}:00")

    planets = compute_planets(dt_local, tz_hours, lat, lon, ayanamsa="lahiri")
    cusps, asc_sidereal = compute_cusps(dt_local, tz_hours, lat, lon, hsys="P")
    asc_idx = sign_index(asc_sidereal)
    rashi_houses  = rashi_from_longitudes(planets, asc_idx)
    chalit_houses = chalit_from_longitudes(planets, cusps)
    vargas_req = [str(v).upper() for v in (data.get("vargas") or ["D9","D10"])]
    varga_maps = compute_vargas(planets, vargas_req)

    table = build_planet_table(planets, asc_idx)
    shadbala = compute_shadbala(planets, asc_idx, chalit_houses, local_hour=dt_local.hour)

    moon_lon = planets.get("Moon", {}).get("lon")
    dasha = None
    if moon_lon is not None:
        dasha = {
            "Vimshottari": compute_vimsottari(dt_local, tz_hours, moon_lon),
            "Yogini":      compute_yogini   (dt_local, tz_hours, moon_lon),
            "Ashtottari":  compute_ashtottari(dt_local, tz_hours, moon_lon),
            "Kalachakra":  compute_kalachakra(dt_local, tz_hours, moon_lon),
        }

    varsha, varsha_predictions = None, None
    if data.get("varsha_year"):
        varsha = compute_varshaphala(dt_local, tz_hours, lat, lon, varsha_year=int(data["varsha_year"]))
        if isinstance(varsha, dict):
            varsha_predictions = varsha.get("predictions")

    acg = compute_astrocartography(dt_local, tz_hours)

    return jsonify({
        "name": name,
        "input": {"dob": dob, "tob": tob, "lat": lat, "lon": lon, "tz": data.get("tz", "+00:00")},
        "asc": {"lon": asc_sidereal, "idx": asc_idx, "sign": SIGN_NAMES[asc_idx]},
        "rashis": SIGN_NAMES,
        "sign_symbols": SIGN_SYMBOLS,
        "table": table,
        "charts": {"rashi": rashi_houses, "chalit": chalit_houses, "vargas": varga_maps},
        "shadbala": shadbala,
        "dasha": dasha,
        "varsha": varsha,
        "varsha_predictions": varsha_predictions,
        "acg": acg
    })
EOF

# --- backend/errors.py ---
writel backend/errors.py <<'EOF'
from flask import jsonify
def install_error_handlers(app):
    @app.errorhandler(404)
    def _404(_):
        return jsonify({"error":{"type":"not_found","message":"Route not found"}}), 404
    @app.errorhandler(500)
    def _500(e):
        return jsonify({"error":{"type":"server_error","message":"Unexpected error"}}), 500
EOF

# --- minimal template ---
writel templates/index.html <<'EOF'
<!doctype html><html lang="en"><meta charset="utf-8">
<title>Sage Astro</title><h1>Sage Astro API</h1>
<p>Backend running. Try <code>/api/v1/health</code>.</p>
EOF

# --- requirements.txt ---
writel requirements.txt <<'EOF'
Flask>=3.0
Flask-Cors>=4.0.0
gunicorn>=21.2
EOF

# --- gunicorn.conf.py ---
writel gunicorn.conf.py <<'EOF'
workers = 2
threads = 4
bind = "0.0.0.0:8000"
timeout = 60
EOF

# --- Dockerfile ---
writel Dockerfile <<'EOF'
FROM python:3.10-slim
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
RUN pip install --no-cache-dir --upgrade pip
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["gunicorn", "app:create_app()", "-c", "gunicorn.conf.py"]
EOF

# --- docker-compose.yml ---
writel docker-compose.yml <<'EOF'
services:
  api:
    build: .
    ports: ["8000:8000"]
    environment: [FLASK_ENV=production]
    restart: unless-stopped
EOF

# --- openapi stub ---
writel openapi/sage-astro.yaml <<'EOF'
openapi: 3.0.3
info: { title: Sage Astro API, version: 1.0.0 }
paths:
  /api/v1/health:
    get: { summary: Health check, responses: { "200": { description: OK } } }
  /api/v1/compute:
    post:
      summary: Compute full kundli payload
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [dob, tob, lat, lon]
              properties:
                name: { type: string }
                dob:  { type: string, example: "1984-09-24" }
                tob:  { type: string, example: "17:30" }
                tz:   { type: string, example: "+05:30" }
                lat:  { type: number }
                lon:  { type: number }
                varsha_year: { type: integer }
                vargas: { type: array, items: { type: string } }
      responses: { "200": { description: Computed chart payload } }
EOF

# --- tests ---
writel tests/test_health.py <<'EOF'
from app import create_app
def test_health():
    app = create_app()
    client = app.test_client()
    rv = client.get("/api/v1/health")
    assert rv.status_code == 200
    assert rv.get_json().get("ok") is True
EOF

# --- .gitignore ---
writel .gitignore <<'EOF'
__pycache__/
*.py[cod]
*.egg-info/
.venv/
venv/
.env
node_modules/
dist/
build/
.vscode/
.idea/
EOF

# --- README ---
writel README.md <<'EOF'
# Sage Astro — API-first Flask backend
## Quickstart
```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
export FLASK_APP=app:create_app
flask run
# or
gunicorn "app:create_app()" -c gunicorn.conf.py
