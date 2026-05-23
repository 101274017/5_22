"""Bounded history cache to prevent memory leaks from in-memory chat dicts."""
from collections import OrderedDict
from typing import Any, Generic, TypeVar

K = TypeVar("K")
V = TypeVar("V")


class BoundedHistoryCache(Generic[K, V]):
    """LRU cache with a fixed max size. Oldest entries are evicted first."""

    def __init__(self, maxsize: int = 500):
        self._cache: OrderedDict[K, V] = OrderedDict()
        self._maxsize = maxsize

    def get(self, key: K, default: V | None = None) -> V | None:
        if key in self._cache:
            self._cache.move_to_end(key)
            return self._cache[key]
        return default

    def set(self, key: K, value: V) -> None:
        if key in self._cache:
            self._cache.move_to_end(key)
        self._cache[key] = value
        while len(self._cache) > self._maxsize:
            self._cache.popitem(last=False)

    def pop(self, key: K, default: V | None = None) -> V | None:
        return self._cache.pop(key, default)

    def __contains__(self, key: K) -> bool:
        return key in self._cache

    def __len__(self) -> int:
        return len(self._cache)
