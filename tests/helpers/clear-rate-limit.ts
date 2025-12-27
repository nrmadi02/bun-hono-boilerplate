/**
 * Helper to clear rate limit for specific IP in tests
 */

import { connection as redis } from "../../src/lib/queue";

/**
 * Clear all rate limit keys from Redis
 */
export async function clearRateLimits() {
	const keys = await redis.keys("rl:*");
	if (keys.length > 0) {
		await redis.del(...keys);
	}
}

/**
 * Clear rate limit for specific prefix
 */
export async function clearRateLimitForPrefix(prefix: string) {
	const keys = await redis.keys(`rl:${prefix}:*`);
	if (keys.length > 0) {
		await redis.del(...keys);
	}
}
