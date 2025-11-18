import type { Context } from "hono";
import { getConnInfo } from "hono/bun";
import { HTTPException } from "hono/http-exception";
import { sign, verify } from "hono/jwt";
import prisma from "prisma";
import type { Prisma, User } from "prisma/generated/client";
import { Provider } from "prisma/generated/enums";
import { UAParser } from "ua-parser-js";
import { env } from "../../config/env";
import type { AppRouteHandler } from "../../lib/types";
import { toUserResponseSchema } from "../../schemas/user/user-response.schema";
import { sendVerificationEmailAsync } from "../../tasks/email/clients/send-verification-email-async";
import {
	catchError,
	errorResponse,
	successResponse,
} from "../../utils/response";
import type {
	ForgotPasswordRoutes,
	GetMeRoutes,
	GetSessionsRoutes,
	LoginRoutes,
	LogoutRoutes,
	RegisterRoutes,
	ResetPasswordRoutes,
} from "./auth.routes";

const getDeviceInfo = (c: Context) => {
	const userAgent = c.req.header("user-agent") || "Unknown";
	const ipAddress = getConnInfo(c);

	const parser = new UAParser(userAgent);
	const result = parser.getResult();

	return {
		deviceName: result.os.name ?? "Unknown",
		ipAddress: ipAddress.remote.address ?? "Unknown",
		userAgent,
	};
};

const manageUserSessions = async (userId: string, maxSessions: number = 5) => {
	await prisma.session.deleteMany({
		where: {
			userId,
			expireAt: {
				lt: new Date(),
			},
		},
	});

	const activeSessions = await prisma.session.findMany({
		where: {
			userId,
			expireAt: {
				gte: new Date(),
			},
		},
		orderBy: {
			createdAt: "asc",
		},
	});

	if (activeSessions.length >= maxSessions) {
		const sessionsToDelete = activeSessions.slice(
			0,
			activeSessions.length - maxSessions + 1,
		);
		await prisma.session.deleteMany({
			where: {
				id: {
					in: sessionsToDelete.map((s) => s.id),
				},
			},
		});
	}
};

const createPayloadToken = (user: User) => {
	const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 2); // 2 days
	const refreshExpires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); // 30 days
	const payload = {
		id: user.id,
		email: user.email,
		role: user.role,
		expires: expires.toISOString(),
	};

	return {
		expires,
		refreshExpires,
		payload,
	};
};

const createSession = async (
	token: string,
	expires: Date,
	userId: string,
	deviceName: string,
	ipAddress: string,
	userAgent: string,
) => {
	await prisma.session.create({
		data: {
			sessionToken: token,
			expireAt: expires,
			userId,
			deviceName,
			ipAddress,
			userAgent,
		},
	});
};

export const loginHandler: AppRouteHandler<LoginRoutes> = async (c) => {
	try {
		const { email, password } = c.req.valid("json");
		const secret = env.JWT_SECRET;

		const user = await prisma.user.findUnique({
			where: {
				email,
			},
			include: {
				accounts: {
					where: {
						provider: Provider.EMAIL,
					},
					select: {
						id: true,
						password: true,
					},
				},
			},
		});

		if (!user) {
			return errorResponse(c, "User not found", ["User not found"], 404);
		}

		const isPasswordValid = await Bun.password.verify(
			password,
			user.accounts[0].password ?? "",
		);

		if (!isPasswordValid) {
			return errorResponse(c, "Invalid password", ["Invalid password"], 400);
		}

		const { expires, refreshExpires, payload } = createPayloadToken(user);

		const token = await sign(payload, secret, "HS256");
		const refreshToken = await sign(
			{ ...payload, expires: refreshExpires.toISOString() },
			secret,
			"HS256",
		);

		await manageUserSessions(user.id, 5);

		const { deviceName, ipAddress, userAgent } = getDeviceInfo(c);

		await createSession(
			token,
			expires,
			user.id,
			deviceName,
			ipAddress,
			userAgent,
		);

		return successResponse(c, "Login successful", {
			token,
			refreshToken,
			user: toUserResponseSchema(user),
		});
	} catch (error) {
		return catchError(error);
	}
};

export const registerHandler: AppRouteHandler<RegisterRoutes> = async (c) => {
	try {
		const { email, password, fullName, username } = c.req.valid("json");
		const secret = env.JWT_SECRET;

		const existingUser = await prisma.user.findFirst({
			where: {
				OR: [
					{ email: email.toLowerCase() },
					{ username: username.toLowerCase() },
				],
			} as Prisma.UserWhereInput,
		});

		if (existingUser) {
			return errorResponse(
				c,
				"User already exists",
				["User already exists"],
				400,
			);
		}

		const hashedPassword = await Bun.password.hash(password);

		const user = await prisma.user.create({
			data: {
				email,
				fullName,
				username,
				accounts: {
					create: {
						provider: Provider.EMAIL,
						password: hashedPassword,
					},
				},
			},
			include: {
				accounts: {
					where: {
						provider: Provider.EMAIL,
					},
					select: {
						id: true,
					},
				},
			},
		});

		const { expires, refreshExpires, payload } = createPayloadToken(user);

		const token = await sign(payload, secret, "HS256");
		const refreshToken = await sign(
			{ ...payload, expires: refreshExpires.toISOString() },
			secret,
			"HS256",
		);

		await manageUserSessions(user.id, 5);

		const { deviceName, ipAddress, userAgent } = getDeviceInfo(c);

		await createSession(
			token,
			expires,
			user.id,
			deviceName,
			ipAddress,
			userAgent,
		);

		await sendVerificationEmailAsync([user.email], token);

		return successResponse(
			c,
			"Register successful",
			{
				token,
				refreshToken,
				user: toUserResponseSchema(user),
			},
			200,
		);
	} catch (error) {
		return catchError(error);
	}
};

export const logoutHandler: AppRouteHandler<LogoutRoutes> = async (c) => {
	try {
		const token = c.var.token;

		if (token) {
			const session = await prisma.session.findFirst({
				where: {
					sessionToken: token,
				},
			});

			if (!session) {
				return errorResponse(
					c,
					"User is not logged in",
					["User is not logged in"],
					401,
				);
			}

			await prisma.session.delete({
				where: {
					sessionToken: token,
				},
			});

			return successResponse(c, "Logged out from device successfully", {
				message: "Logged out from device successfully",
			});
		}

		const session = await prisma.session.findUnique({
			where: {
				sessionToken: token,
			},
		});

		if (session) {
			await prisma.session.delete({
				where: {
					sessionToken: token,
				},
			});
		}

		return successResponse(c, "Logged out successfully", {
			message: "Logged out successfully",
		});
	} catch (error) {
		return catchError(error);
	}
};

export const getSessionsHandler: AppRouteHandler<GetSessionsRoutes> = async (
	c,
) => {
	try {
		const userId = c.var.userId;
		const token = c.var.token;

		await prisma.session.deleteMany({
			where: {
				userId,
				expireAt: {
					lt: new Date(),
				},
			},
		});
		const sessions = await prisma.session.findMany({
			where: {
				userId,
				expireAt: {
					gte: new Date(),
				},
			},
			orderBy: {
				createdAt: "desc",
			},
		});

		const sessionsData = sessions.map((session) => ({
			id: session.id,
			deviceName: session.deviceName,
			ipAddress: session.ipAddress,
			userAgent: session.userAgent,
			createdAt: session.createdAt.toISOString(),
			expireAt: session.expireAt.toISOString(),
			isCurrent: session.sessionToken === token,
		}));

		return successResponse(c, "Sessions retrieved successfully", {
			sessions: sessionsData,
		});
	} catch (error) {
		return catchError(error);
	}
};

export const getMeHandler: AppRouteHandler<GetMeRoutes> = async (c) => {
	try {
		const userId = c.var.userId;
		const user = await prisma.user.findUnique({
			where: { id: userId },
		});

		if (!user) {
			return errorResponse(c, "User not found", ["User not found"], 404);
		}

		return successResponse(c, "User retrieved successfully", {
			user: toUserResponseSchema(user),
		});
	} catch (error) {
		return catchError(error);
	}
};

export const forgotPasswordHandler: AppRouteHandler<
	ForgotPasswordRoutes
> = async (c) => {
	try {
		const { email } = c.req.valid("json");

		const user = await prisma.user.findUnique({
			where: { email },
		});

		if (!user) {
			return errorResponse(c, "User not found", ["User not found"], 404);
		}

		const secret = env.JWT_SECRET;
		const expires = new Date(Date.now() + 1000 * 60 * 30); // 30 minutes
		const payload = {
			id: user?.id,
			email: user?.email,
			role: user?.role,
			expires: expires.toISOString(),
		};

		const _token = await sign(payload, secret, "HS256");

		// TODO: Send email to user with reset password token

		return successResponse(c, "Forgot password successful", {
			message: "Forgot password successful",
		});
	} catch (error) {
		return catchError(error);
	}
};

export const resetPasswordHandler: AppRouteHandler<
	ResetPasswordRoutes
> = async (c) => {
	try {
		const { token, password, confirmPassword } = c.req.valid("json");

		if (password !== confirmPassword) {
			return errorResponse(
				c,
				"Passwords do not match",
				["Passwords do not match"],
				400,
			);
		}

		const secret = env.JWT_SECRET;
		const isVerifiedToken = await verify(token, secret, "HS256");
		const expireAt = new Date((isVerifiedToken.exp as number) * 1000);

		if (!isVerifiedToken)
			throw new HTTPException(400, { message: "Invalid token" });
		if (expireAt < new Date())
			throw new HTTPException(400, { message: "Token expired" });

		const hashedPassword = await Bun.password.hash(password);

		const account = await prisma.account.findFirst({
			where: { userId: isVerifiedToken.id as string },
		});

		if (!account)
			throw new HTTPException(400, { message: "Account not found" });

		await prisma.account.update({
			where: { id: account.id },
			data: { password: hashedPassword },
		});

		await prisma.session.deleteMany({
			where: { userId: isVerifiedToken.id as string },
		});

		return successResponse(c, "Reset password successful", {
			message: "Reset password successful",
		});
	} catch (error) {
		return catchError(error);
	}
};
