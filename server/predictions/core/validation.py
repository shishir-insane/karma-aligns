# core/validation.py
from __future__ import annotations
from pydantic import BaseModel, Field, validator
from typing import Optional
import datetime as dt
import re

TZ_RE = re.compile(r"^[+-](?:0\d|1[0-4]):?[0-5]\d$")  # supports ±00:00 .. ±14:00

class BirthInput(BaseModel):
    date: dt.date
    time: Optional[str] = Field(None, description="HH:MM[:SS]")
    tz: str = "+00:00"  # offset like +05:30
    lat: float = Field(..., ge=-90, le=90)
    lon: float = Field(..., ge=-180, le=180)
    alt: float = 0.0

    @validator("time")
    def _time_fmt(cls, v):
        if v is None: return None
        try:
            dt.time.fromisoformat(v)
            return v
        except ValueError:
            raise ValueError("time must be HH:MM or HH:MM:SS")

    @validator("tz")
    def _tz_fmt(cls, v):
        if not TZ_RE.match(v):
            raise ValueError("tz must be ±HH:MM")
        if ":" not in v:  # allow +0530
            v = v[:3] + ":" + v[3:]
        return v

    def to_datetime(self) -> dt.datetime:
        h, m = 12, 0
        if self.time:
            parts = list(map(int, self.time.split(":")))
            h, m = parts[0], parts[1]
        sign = 1 if self.tz[0] == "+" else -1
        th, tm = map(int, self.tz[1:].split(":"))
        tzinfo = dt.timezone(dt.timedelta(hours=sign*th, minutes=sign*tm))
        return dt.datetime(self.date.year, self.date.month, self.date.day, h, m, tzinfo=tzinfo)
