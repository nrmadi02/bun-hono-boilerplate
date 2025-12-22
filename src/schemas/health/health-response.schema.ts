import z from "zod";

/**
 * Health check data schema
 */
export const healthDataSchema = z.object({
	status: z.string(),
	timestamp: z.string(),
	uptime: z.number(),
	environment: z.string().optional(),
});

/**
 * Readiness check data schema
 */
export const readinessDataSchema = z.object({
	status: z.enum(["ready", "not_ready"]),
	timestamp: z.string(),
	checks: z.object({
		database: z.object({
			status: z.string(),
			latency: z.number().optional(),
			error: z.string().optional(),
		}),
		redis: z.object({
			status: z.string(),
			latency: z.number().optional(),
			error: z.string().optional(),
		}),
		queue: z.object({
			status: z.string(),
			latency: z.number().optional(),
			error: z.string().optional(),
		}),
	}),
});

/**
 * Liveness check data schema
 */
export const livenessDataSchema = z.object({
	status: z.string(),
	timestamp: z.string(),
	uptime: z.number(),
	memory: z.object({
		used: z.number(),
		total: z.number(),
		external: z.number(),
		rss: z.number(),
	}),
	eventLoopLatency: z.number(),
});

/**
 * System metrics data schema
 */
export const metricsDataSchema = z.object({
	timestamp: z.string(),
	uptime: z.number(),
	memory: z.object({
		heapUsed: z.number(),
		heapTotal: z.number(),
		external: z.number(),
		rss: z.number(),
	}),
	cpu: z.object({
		user: z.number(),
		system: z.number(),
	}),
	database: z.record(z.string(), z.any()),
	redis: z.record(z.string(), z.any()),
	environment: z.object({
		nodeVersion: z.string(),
		platform: z.string(),
		arch: z.string(),
		env: z.string(),
	}),
});

