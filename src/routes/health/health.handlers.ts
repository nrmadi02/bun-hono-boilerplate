import prisma from "../../../prisma";
import { connection } from "../../lib/queue";
import type { AppRouteHandler } from "../../lib/types";
import type { HealthRoute, LivenessRoute, MetricsRoute, ReadinessRoute } from "./health.routes";
import { successResponse, errorResponse } from "../../utils/response";

/**
 * Basic health check - returns 200 if server is running
 */
export const healthHandler: AppRouteHandler<HealthRoute> = async (c) => {
	return successResponse(
		c,
		"Service is healthy",
		{
			status: "ok",
			timestamp: new Date().toISOString(),
			uptime: process.uptime(),
			environment: process.env.NODE_ENV || "development",
		},
	);
};

/**
 * Readiness check - checks if app is ready to serve traffic
 * Checks: Database, Redis, Queue
 */
export const readinessHandler: AppRouteHandler<ReadinessRoute> = async (c) => {
	const checks: Record<string, { status: string; latency?: number; error?: string }> = {};
	let overallStatus = "ready";

	// 1. Check Database
	try {
		const dbStart = Date.now();
		await prisma.$queryRaw`SELECT 1`;
		const dbLatency = Date.now() - dbStart;
		checks.database = {
			status: "up",
			latency: dbLatency,
		};
	} catch (error) {
		checks.database = {
			status: "down",
			error: error instanceof Error ? error.message : "Unknown error",
		};
		overallStatus = "not_ready";
	}

	// 2. Check Redis
	try {
		const redisStart = Date.now();
		await connection.ping();
		const redisLatency = Date.now() - redisStart;
		checks.redis = {
			status: "up",
			latency: redisLatency,
		};
	} catch (error) {
		checks.redis = {
			status: "down",
			error: error instanceof Error ? error.message : "Unknown error",
		};
		overallStatus = "not_ready";
	}

	// 3. Check Queue (BullMQ)
	try {
		const queueStart = Date.now();
		// Simple check if queue connection is active
		const queueStatus = connection.status;
		const queueLatency = Date.now() - queueStart;
		
		checks.queue = {
			status: queueStatus === "ready" ? "up" : "down",
			latency: queueLatency,
		};
		
		if (queueStatus !== "ready") {
			overallStatus = "not_ready";
		}
	} catch (error) {
		checks.queue = {
			status: "down",
			error: error instanceof Error ? error.message : "Unknown error",
		};
		overallStatus = "not_ready";
	}

	// Return 503 if not ready (Kubernetes will not route traffic)
	if (overallStatus === "not_ready") {
		const errorMessages: string[] = [];
		if (checks.database.status === "down") {
			errorMessages.push(`Database: ${checks.database.error || "Connection failed"}`);
		}
		if (checks.redis.status === "down") {
			errorMessages.push(`Redis: ${checks.redis.error || "Connection failed"}`);
		}
		if (checks.queue.status === "down") {
			errorMessages.push(`Queue: ${checks.queue.error || "Connection failed"}`);
		}
		
		return errorResponse(c, "Service not ready", errorMessages, 503);
	}

	return successResponse(
		c,
		"Service is ready",
		{
			status: overallStatus,
			timestamp: new Date().toISOString(),
			checks,
		},
	);
};

/**
 * Liveness check - checks if app is alive (not deadlocked)
 * Simple check, no external dependencies
 */
export const livenessHandler: AppRouteHandler<LivenessRoute> = async (c) => {
	// Check if event loop is responsive
	const start = Date.now();
	await new Promise((resolve) => setImmediate(resolve));
	const eventLoopLatency = Date.now() - start;

	// If event loop is blocked for more than 1 second, consider unhealthy
	if (eventLoopLatency > 1000) {
		return errorResponse(
			c,
			"Event loop is blocked",
			[`Event loop latency: ${eventLoopLatency}ms (threshold: 1000ms)`],
			503,
		);
	}

	return successResponse(
		c,
		"Service is alive",
		{
			status: "alive",
			timestamp: new Date().toISOString(),
			uptime: process.uptime(),
			memory: {
				used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
				total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
				external: Math.round(process.memoryUsage().external / 1024 / 1024),
				rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
			},
			eventLoopLatency,
		},
	);
};

/**
 * Detailed system metrics
 */
export const metricsHandler: AppRouteHandler<MetricsRoute> = async (c) => {
	// Get database pool stats (if available)
	let dbStats = {};
	try {
		// @ts-ignore - accessing internal metrics
		const metrics = await prisma.$metrics.json();
		dbStats = {
			connections: metrics?.counters?.find((m: any) => m.key === "prisma_client_queries_total")?.value || 0,
		};
	} catch {
		// Metrics not available
	}

	// Get Redis info
	let redisStats = {};
	try {
		const info = await connection.info();
		const lines = info.split("\r\n");
		const connectedClients = lines.find((l) => l.startsWith("connected_clients:"))?.split(":")[1];
		const usedMemory = lines.find((l) => l.startsWith("used_memory_human:"))?.split(":")[1];
		
		redisStats = {
			connectedClients: Number.parseInt(connectedClients || "0"),
			usedMemory: usedMemory?.trim() || "unknown",
		};
	} catch {
		// Redis info not available
	}

	return successResponse(
		c,
		"System metrics retrieved",
		{
			timestamp: new Date().toISOString(),
			uptime: process.uptime(),
			memory: {
				heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
				heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
				external: Math.round(process.memoryUsage().external / 1024 / 1024),
				rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
			},
			cpu: {
				user: process.cpuUsage().user,
				system: process.cpuUsage().system,
			},
			database: dbStats,
			redis: redisStats,
			environment: {
				nodeVersion: process.version,
				platform: process.platform,
				arch: process.arch,
				env: process.env.NODE_ENV || "development",
			},
		},
	);
};

