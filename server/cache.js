/**
 * Simple in-memory cache with TTL support.
 * Default TTL is 5 seconds to reduce Genesys API call frequency.
 */

class Cache {
  constructor(ttlMs = 5000) {
    this.ttlMs = ttlMs;
    this.store = new Map();
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key, value) {
    this.store.set(key, {
      value,
      timestamp: Date.now(),
    });
  }

  clear() {
    this.store.clear();
  }
}

module.exports = new Cache();
