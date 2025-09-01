# config.py
from __future__ import annotations
import os

class Base:
    JSON_SORT_KEYS = False
    MAX_CONTENT_LENGTH = 32 * 1024  # protect against giant payloads
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
    RATE_LIMIT_API = os.getenv("RATE_LIMIT_API", "60 per minute")
    RATE_LIMIT_COMPUTE = os.getenv("RATE_LIMIT_COMPUTE", "25 per minute")
    EPHE_PATH = os.getenv("EPHE_PATH", "")  # Swiss ephemeris dir; optional

class Dev(Base):
    DEBUG = True

class Prod(Base):
    DEBUG = False

def load():
    env = os.getenv("FLASK_ENV", "development").lower()
    return Dev if env.startswith("dev") else Prod
