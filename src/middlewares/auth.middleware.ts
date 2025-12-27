import type { Context, Next } from "hono";
import { createMiddleware } from "hono/factory";
import { verify } from "hono/jwt";
import { env } from "../config/env";
import { tokenService } from "../services/auth";
import { errorResponse } from "../utils/response";

export const validateToken = createMiddleware<{
	Variables: {
		userId: string;
		token: string;
	};
}>(async (c: Context, next: Next) => {
	const authHeader = c.req.header("Authorization");
	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return errorResponse(
			c,
			"Unauthorized - No token provided",
			["Unauthorized - No token provided"],
			401,
		);
	}

	const token = authHeader.substring(7);
	const secret = env.JWT_SECRET;

	const findToken = await tokenService.findToken(token);

	if (!findToken || !findToken.sessionToken) {
		return errorResponse(
			c,
			"Unauthorized - Invalid token",
			["Unauthorized - Invalid token"],
			401,
		);
	}

	if (findToken.expireAt < new Date()) {
		return errorResponse(
			c,
			"Unauthorized - Token expired",
			["Unauthorized - Token expired"],
			401,
		);
	}

	try {
		const payload = await verify(token, secret, "HS256");

		if (!findToken.userId || payload.id !== findToken.userId) {
			return errorResponse(
				c,
				"Unauthorized - Token does not belong to this user",
				["Unauthorized - Token does not belong to this user"],
				401,
			);
		}

		c.set("userId", payload.id as string);
		c.set("token", token);
		await next();
	} catch {
		return errorResponse(
			c,
			"Unauthorized - Invalid token",
			["Unauthorized - Invalid token"],
			401,
		);
	}
});

export const validateRefreshToken = createMiddleware<{
	Variables: {
		userId: string;
		refreshToken: string;
	};
}>(async (c, next) => {
	const authHeader = c.req.header("Authorization");
	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return errorResponse(
			c,
			"Unauthorized - No refresh token provided",
			["Unauthorized - No refresh token provided"],
			401,
		);
	}

	const token = authHeader.substring(7);
	const secret = env.JWT_SECRET;

	const findToken = await tokenService.findRefreshToken(token);
	const refreshToken = findToken?.refreshToken;
	const refreshTokenExpiresAt = findToken?.refreshTokenExpiresAt;
	const isRefreshTokenExpired =
		refreshTokenExpiresAt && refreshTokenExpiresAt < new Date();

	if (!refreshToken) {
		return errorResponse(
			c,
			"Unauthorized - Invalid refresh token",
			["Unauthorized - Invalid refresh token"],
			401,
		);
	}

	if (isRefreshTokenExpired) {
		return errorResponse(
			c,
			"Unauthorized - Refresh token expired",
			["Unauthorized - Refresh token expired"],
			401,
		);
	}

	try {
		const payload = await verify(refreshToken, secret, "HS256");

		if (!findToken.userId || payload.id !== findToken.userId) {
			return errorResponse(
				c,
				"Unauthorized - Refresh token does not belong to this user",
				["Unauthorized - Refresh token does not belong to this user"],
				401,
			);
		}

		c.set("userId", payload.id as string);
		c.set("refreshToken", refreshToken);
		await next();
	} catch {
		return errorResponse(
			c,
			"Unauthorized - Invalid refresh token",
			["Unauthorized - Invalid refresh token"],
			401,
		);
	}
});
