"""
app.py — Flask app factory for API-first backend

- Loads config from config.py (env-driven)
- CORS for /api/* (origins from config)
- JSON error handlers (if backend/errors.py exists)
- Registers the API blueprint (backend/api)
- Optional extensions: Flask-Limiter, Flask-Caching
- Request-ID middleware + security headers
- Liveness (/health), readiness (/ready), version (/version)
- Serves OpenAPI (/openapi/sage-astro.yaml) + Redoc (/docs)
"""

import os
import sys
import uuid
import time
import logging
from flask import Flask, render_template, jsonify, g, request
from config import load as load_config

# --- Optional CORS ---
try:
    from flask_cors import CORS
except Exception:
    CORS = None

# --- Optional Limiter (v3.x) ---
try:
    from flask_limiter import Limiter
    from flask_limiter.util import get_remote_address
    limiter = Limiter(
        key_func=get_remote_address,
        default_limits=None,        # we’ll apply per-endpoint rules below
        storage_uri="memory://",    # PROD: e.g. "redis://localhost:6379/0"
    )
except Exception:
    limiter = None

# --- Optional Cache ---
try:
    from flask_caching import Cache
    cache = Cache(config={"CACHE_TYPE": "SimpleCache", "CACHE_DEFAULT_TIMEOUT": 600})
except Exception:
    cache = None

# Ensure project root is importable
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)


def create_app() -> Flask:
    app = Flask(__name__)
    app.config.from_object(load_config())

    # Logging
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
    app.logger.info("Booting Sage Astro API")

    # Request ID + security headers
    @app.before_request
    def add_reqid():
        g.reqid = request.headers.get("X-Request-ID") or str(uuid.uuid4())

    @app.after_request
    def add_common_headers(resp):
        resp.headers["X-Request-ID"] = getattr(g, "reqid", "")
        resp.headers["X-Content-Type-Options"] = "nosniff"
        resp.headers["X-Frame-Options"] = "DENY"
        resp.headers["Referrer-Policy"] = "no-referrer"
        # In TLS prod you can enable HSTS:
        # resp.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload"
        return resp

    # CORS (origins from config)
    if CORS:
        CORS(app, resources={r"/api/*": {"origins": app.config.get("CORS_ORIGINS", [])}})

    # JSON error handlers (optional)
    try:
        from backend.errors import install_error_handlers
        install_error_handlers(app)
    except Exception as e:
        app.logger.debug("Error handlers not installed: %s", e)

    # API blueprint
    from backend.api import api  # __init__.py should import v1 and parts
    app.register_blueprint(api)

    # Extensions AFTER app exists
    if limiter:
        limiter.init_app(app)
        # Config-driven blanket & specific limits
        api_rate = app.config.get("RATE_LIMIT_API", "60 per minute")
        compute_rate = app.config.get("RATE_LIMIT_COMPUTE", "25 per minute")

        # Apply to the blueprint (optional blanket)
        limiter.limit(api_rate)(api)

        # Per-endpoint rules (only if endpoint exists)
        endpoint_limits = [
            ("api.health",        api_rate),
            ("api.compute",       compute_rate),
            ("api.asc",           "200 per minute"),
            ("api.houses",        "120 per minute"),
            ("api.planets",       "120 per minute"),
            ("api.charts_rashi",  "120 per minute"),
            ("api.charts_chalit", "120 per minute"),
        ]
        for ep, rule in endpoint_limits:
            if ep in app.view_functions:
                limiter.limit(rule)(app.view_functions[ep])

    if cache:
        cache.init_app(app)

    # Liveness / Readiness / Version
    @app.get("/health")
    def health():
        return {"ok": True, "service": "sage-astro-api", "ts": int(time.time())}, 200

    @app.get("/ready")
    def ready():
        ephe = app.config.get("EPHE_PATH") or ""
        ephe_ok, detail = True, None
        try:
            from astrology import swe_utils as su
            su.init(ephe_path=ephe, ayanamsa=app.config.get("SIDEREAL_AYANAMSA", "lahiri"))
        except Exception as e:
            ephe_ok, detail = False, str(e)
        return ({"ok": ephe_ok, "ephemeris_path": ephe or "(default)", "detail": detail}, 200 if ephe_ok else 503)

    @app.get("/version")
    def version():
        try:
            import flask  # noqa
            flask_version = flask.__version__
        except Exception:
            flask_version = "unknown"
        return {"service": "sage-astro-api", "version": "1.0.0", "flask": flask_version}, 200

    # OpenAPI + Docs
    @app.get("/openapi/sage-astro.yaml")
    def openapi_yaml():
        from flask import send_from_directory
        return send_from_directory("openapi", "sage-astro.yaml")

    @app.get("/docs")
    def docs():
        html = """<!doctype html><html><head><title>API Docs</title>
        <meta charset="utf-8">
        <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
        </head><body style="margin:0">
        <redoc spec-url='/openapi/sage-astro.yaml'></redoc>
        </body></html>"""
        return html, 200, {"Content-Type": "text/html"}

    # Temporary root
    @app.get("/")
    def index():
        try:
            return render_template("index.html")
        except Exception:
            return jsonify({"ok": True, "msg": "Sage Astro API is running. See /api/v1/health."})

    return app


# WSGI entry
app = create_app()

if __name__ == "__main__":
    app.run(debug=True)
