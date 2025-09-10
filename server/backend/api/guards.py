# api/guards.py
from dataclasses import dataclass

@dataclass
class CalcContext:
    unknown_time: bool
    precision: str  # 'high'|'coarse'
