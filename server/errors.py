# backend/errors.py
from flask import jsonify
from werkzeug.exceptions import HTTPException

def install_error_handlers(app):
    @app.errorhandler(HTTPException)
    def http_err(e: HTTPException):
        return jsonify({"error": {
            "type": e.name.replace(" ", "_").lower(),
            "status": e.code, "message": e.description
        }}), e.code

    @app.errorhandler(413)
    def too_large(_):
        return jsonify({"error":{"type":"payload_too_large","status":413,"message":"Request too large"}}), 413

    @app.errorhandler(500)
    def server_err(e):
        app.logger.exception("Unhandled error: %s", e)
        return jsonify({"error":{"type":"server_error","status":500,"message":"Unexpected error"}}), 500
