import type { Context } from "hono";
import { rateLimiter } from "hono-rate-limiter";
import { connection } from "../lib/queue";
import { createRedisStore } from "../lib/rate-limit-redis-store";

const getClientIdentifier = (c: Context) => {
	const forwardedFor = c.req.header("x-forwarded-for");
	if (forwardedFor) {
		return forwardedFor.split(",")[0].trim();
	}

	const realIp = c.req.header("x-real-ip");
	if (realIp) {
		return realIp;
	}

	return c.req.header("cf-connecting-ip") || "unknown";
};

export const apiLimiter = rateLimiter({
	windowMs: 15 * 60 * 1000,
	limit: 100,
	standardHeaders: "draft-6",
	keyGenerator: getClientIdentifier,
	store: createRedisStore({
		client: connection,
		prefix: "rl:api:",
		windowMs: 15 * 60 * 1000,
	}),
	message: {
		success: false,
		message: "Too many requests from this IP, please try again later",
		errors: ["Rate limit exceeded. Please try again in a few minutes."],
	},
});

export const authLimiter = rateLimiter({
	windowMs: 15 * 60 * 1000,
	limit: 5,
	standardHeaders: "draft-6",
	keyGenerator: getClientIdentifier,
	store: createRedisStore({
		client: connection,
		prefix: "rl:auth:",
		windowMs: 15 * 60 * 1000,
	}),
	message: {
		success: false,
		message: "Too many authentication attempts, please try again later",
		errors: [
			"Account temporarily locked due to multiple failed attempts. Please try again in 15 minutes.",
		],
	},
});

export const passwordResetLimiter = rateLimiter({
	windowMs: 60 * 60 * 1000,
	limit: 3,
	standardHeaders: "draft-6",
	keyGenerator: getClientIdentifier,
	store: createRedisStore({
		client: connection,
		prefix: "rl:pwd:",
		windowMs: 60 * 60 * 1000,
	}),
	message: {
		success: false,
		message: "Too many password reset attempts",
		errors: [
			"You have exceeded the password reset limit. Please try again in 1 hour.",
		],
	},
});

export const adminLimiter = rateLimiter({
	windowMs: 15 * 60 * 1000,
	limit: 200,
	standardHeaders: "draft-6",
	keyGenerator: getClientIdentifier,
	store: createRedisStore({
		client: connection,
		prefix: "rl:admin:",
		windowMs: 15 * 60 * 1000,
	}),
	message: {
		success: false,
		message: "Too many admin requests",
		errors: ["Admin rate limit exceeded. Please try again later."],
	},
});

export const emailLimiter = rateLimiter({
	windowMs: 60 * 60 * 1000,
	limit: 10,
	standardHeaders: "draft-6",
	keyGenerator: getClientIdentifier,
	store: createRedisStore({
		client: connection,
		prefix: "rl:email:",
		windowMs: 60 * 60 * 1000,
	}),
	message: {
		success: false,
		message: "Too many email requests",
		errors: ["Email sending limit exceeded. Please try again in 1 hour."],
	},
});

export const heavyOperationLimiter = rateLimiter({
	windowMs: 60 * 1000,
	limit: 10,
	standardHeaders: "draft-6",
	keyGenerator: getClientIdentifier,
	store: createRedisStore({
		client: connection,
		prefix: "rl:heavy:",
		windowMs: 60 * 1000,
	}),
	message: {
		success: false,
		message: "Too many requests for this operation",
		errors: ["Operation rate limit exceeded. Please try again in a minute."],
	},
});
