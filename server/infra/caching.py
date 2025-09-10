# infra/caching.py
import time
from functools import lru_cache, wraps

def ttl_cache(ttl_seconds: int, maxsize: int = 256):
    def deco(fn):
        @lru_cache(maxsize=maxsize)
        def cached(key, *args, **kwargs):
            return time.time(), fn(*args, **kwargs)
        @wraps(fn)
        def wrapper(*args, **kwargs):
            key = (args, tuple(sorted(kwargs.items())))
            ts, val = cached(key, *args, **kwargs)
            if time.time() - ts > ttl_seconds:
                cached.cache_clear()
                ts, val = cached(key, *args, **kwargs)
            return val
        wrapper.cache_clear = lambda: cached.cache_clear()
        return wrapper
    return deco
