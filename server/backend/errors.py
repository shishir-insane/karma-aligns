from flask import jsonify
def install_error_handlers(app):
    @app.errorhandler(404)
    def _404(_):
        return jsonify({"error":{"type":"not_found","message":"Route not found"}}), 404
    @app.errorhandler(500)
    def _500(e):
        return jsonify({"error":{"type":"server_error","message":"Unexpected error"}}), 500
