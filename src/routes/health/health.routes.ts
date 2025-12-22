import { createRoute } from "@hono/zod-openapi";
import { baseResponseSchema, createErrorSchema } from "../../schemas/base.schema";
import {
	healthDataSchema,
	readinessDataSchema,
	livenessDataSchema,
	metricsDataSchema,
} from "../../schemas/health/health-response.schema";




export const healthRoute = createRoute({
	method: "get",
	path: "/health",
	tags: ["Health"],
	summary: "Basic health check",
	description: "Returns 200 if the server is running. Use for simple uptime monitoring.",
	responses: {
		200: {
			description: "Server is healthy",
			content: {
				"application/json": {
					schema: baseResponseSchema(healthDataSchema),
				},
			},
		},
	},
});

export const readinessRoute = createRoute({
	method: "get",
	path: "/health/ready",
	tags: ["Health"],
	summary: "Readiness check",
	description: "Checks if the application is ready to serve traffic. Verifies database, Redis, and queue connections. Returns 503 if not ready.",
	responses: {
		200: {
			description: "Application is ready",
			content: {
				"application/json": {
					schema: baseResponseSchema(readinessDataSchema),
				},
			},
		},
		503: {
			description: "Application is not ready",
			content: {
				"application/json": {
					schema: createErrorSchema(),
				},
			},
		},
	},
});

export const livenessRoute = createRoute({
	method: "get",
	path: "/health/live",
	tags: ["Health"],
	summary: "Liveness check",
	description: "Checks if the application is alive and not deadlocked. Monitors event loop latency and memory usage.",
	responses: {
		200: {
			description: "Application is alive",
			content: {
				"application/json": {
					schema: baseResponseSchema(livenessDataSchema),
				},
			},
		},
		503: {
			description: "Application is unhealthy (event loop blocked)",
			content: {
				"application/json": {
					schema: createErrorSchema(),
				},
			},
		},
	},
});

export const metricsRoute = createRoute({
	method: "get",
	path: "/health/metrics",
	tags: ["Health"],
	summary: "System metrics",
	description: "Returns detailed system metrics including memory, CPU, database, and Redis statistics.",
	responses: {
		200: {
			description: "System metrics",
			content: {
				"application/json": {
					schema: baseResponseSchema(metricsDataSchema),
				},
			},
		},
	},
});

export type HealthRoute = typeof healthRoute;
export type ReadinessRoute = typeof readinessRoute;
export type LivenessRoute = typeof livenessRoute;
export type MetricsRoute = typeof metricsRoute;
