
import { env } from "../config/env";
import { redisCache } from "./cache-redis";

export interface ICache {
  get<T>(key: string): Promise<T | null> | T | null;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> | void;
  delete(key: string): Promise<void> | void;
  deletePattern(pattern: string): Promise<void> | void;
  clear(): Promise<void> | void;
  stats(): Promise<{ size: number; keys: string[] }> | { size: number; keys: string[] };
}

interface CacheItem<T> {
  value: T;
  expiresAt: number;
}

class MemoryCache implements ICache {
  private cache: Map<string, CacheItem<any>> = new Map();

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.value as T;
  }

  set<T>(key: string, value: T, ttlSeconds: number = 300): void {
    const expiresAt = Date.now() + (ttlSeconds * 1000);
    this.cache.set(key, { value, expiresAt });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  deletePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  stats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  cleanup(): void {
    const now = Date.now();

    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

function getCacheImplementation(): ICache {
  const useRedis = env.USE_REDIS_CACHE || env.NODE_ENV === "production";
  
  if (useRedis) {
    try {
      return redisCache;
    } catch (error) {
      console.error("Failed to initialize Redis cache, falling back to in-memory", error);
      const memCache = new MemoryCache();
      setupMemoryCacheCleanup(memCache);
      return memCache;
    }
  } else {
    const memCache = new MemoryCache();
    setupMemoryCacheCleanup(memCache);
    return memCache;
  }
}

function setupMemoryCacheCleanup(memCache: MemoryCache): void {
  setInterval(() => {
    memCache.cleanup();
  }, 5 * 60 * 1000);
}

export const cache = getCacheImplementation();

export const CacheKeys = {
  user: (userId: string) => `user:${userId}`,
  userRoles: (userId: string) => `user:${userId}:roles`,
  allUsers: () => "users:all",
  session: (sessionId: string) => `session:${sessionId}`,
};

