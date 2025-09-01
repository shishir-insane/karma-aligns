from flask import Blueprint
api = Blueprint("api", __name__, url_prefix="/api/v1")
from . import v1  # noqa: E402,F401
from . import parts  # register lightweight endpoints
