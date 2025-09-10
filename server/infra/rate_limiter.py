# infra/rate_limiter.py
import time
from collections import defaultdict

class TokenBucket:
    def __init__(self, rate_per_sec: float, burst: int):
        self.rate = rate_per_sec
        self.capacity = burst
        self.tokens = defaultdict(lambda: burst)
        self.timestamp = defaultdict(lambda: time.time())

    def allow(self, key: str) -> bool:
        now = time.time()
        elapsed = now - self.timestamp[key]
        self.timestamp[key] = now
        self.tokens[key] = min(self.capacity, self.tokens[key] + elapsed*self.rate)
        if self.tokens[key] >= 1:
            self.tokens[key] -= 1
            return True
        return False
