import Redis from "ioredis";
import { env } from "../config/env";

const redis = new Redis({
  host: env.REDIS_HOST,
  port: Number.parseInt(env.REDIS_PORT),
  maxRetriesPerRequest: null,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  lazyConnect: true,
});

redis.connect().catch((err) => {
  console.error("❌ Redis connection failed:", err.message);
  console.warn("⚠️  Falling back to in-memory cache");
});

redis.on("connect", () => {
  console.log("✅ Redis connected");
});

redis.on("error", (err) => {
  console.error("❌ Redis error:", err.message);
});

redis.on("close", () => {
  console.warn("⚠️  Redis connection closed");
});

class RedisCache {
  private redis: Redis;
  private prefix: string = "cache:";

  constructor(redisClient: Redis) {
    this.redis = redisClient;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.redis.get(this.prefix + key);
      
      if (!data) {
        return null;
      }

      return JSON.parse(data) as T;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds: number = 300): Promise<void> {
    try {
      const data = JSON.stringify(value);
      await this.redis.setex(this.prefix + key, ttlSeconds, data);
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.redis.del(this.prefix + key);
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
    }
  }

  async deletePattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(this.prefix + pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.error(`Cache deletePattern error for pattern ${pattern}:`, error);
    }
  }

  async clear(): Promise<void> {
    try {
      const keys = await this.redis.keys(this.prefix + "*");
      if (keys.length > 0) {
        await this.redis.del(...keys);
        console.log(`🗑️  Cache cleared: ${keys.length} keys deleted`);
      }
    } catch (error) {
      console.error("Cache clear error:", error);
    }
  }

  async stats(): Promise<{ size: number; keys: string[]; memory: string }> {
    try {
      const keys = await this.redis.keys(this.prefix + "*");
      const info = await this.redis.info("memory");
      const memoryMatch = info.match(/used_memory_human:(.+)/);
      const memory = memoryMatch ? memoryMatch[1].trim() : "unknown";

      return {
        size: keys.length,
        keys: keys.map((k) => k.replace(this.prefix, "")),
        memory,
      };
    } catch (error) {
      console.error("Cache stats error:", error);
      return { size: 0, keys: [], memory: "unknown" };
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(this.prefix + key);
      return result === 1;
    } catch (error) {
      console.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      return await this.redis.ttl(this.prefix + key);
    } catch (error) {
      console.error(`Cache ttl error for key ${key}:`, error);
      return -1;
    }
  }

  async increment(key: string, amount: number = 1): Promise<number> {
    try {
      return await this.redis.incrby(this.prefix + key, amount);
    } catch (error) {
      console.error(`Cache increment error for key ${key}:`, error);
      return 0;
    }
  }

  async setIfNotExists<T>(key: string, value: T, ttlSeconds: number = 300): Promise<boolean> {
    try {
      const data = JSON.stringify(value);
      const result = await this.redis.set(
        this.prefix + key,
        data,
        "EX",
        ttlSeconds,
        "NX"
      );
      return result === "OK";
    } catch (error) {
      console.error(`Cache setIfNotExists error for key ${key}:`, error);
      return false;
    }
  }

  getClient(): Redis {
    return this.redis;
  }

  async close(): Promise<void> {
    await this.redis.quit();
  }
}

export const redisCache = new RedisCache(redis);

export const CacheKeys = {
  user: (userId: string) => `user:${userId}`,
  userRoles: (userId: string) => `user:${userId}:roles`,
  allUsers: () => "users:all",
  session: (sessionId: string) => `session:${sessionId}`,
  rateLimit: (ip: string, endpoint: string) => `ratelimit:${ip}:${endpoint}`,
};

export { redis };

