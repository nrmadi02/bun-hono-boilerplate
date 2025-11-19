import type { AppRouteHandler } from "../../lib/types";
import { toUserResponseSchema } from "../../schemas/user/user-response.schema";
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
import * as authService from "../../services/auth/auth.service";
import * as sessionService from "../../services/auth/session.service";
import * as passwordResetService from "../../services/auth/password-reset.service";
import * as deviceService from "../../services/auth/device.service";

export const loginHandler: AppRouteHandler<LoginRoutes> = async (c) => {
	try {
		const { email, password } = c.req.valid("json");

		const result = await authService.loginUser(email, password);

		if (!result) {
			return errorResponse(c, "Invalid credentials", ["Invalid credentials"], 400);
		}

		const { user, token, expires, refreshToken } = result;

		await sessionService.manageUserSessions(user.id);

		const deviceInfo = deviceService.getDeviceInfo(c);
		await sessionService.createSession(token, expires, user.id, deviceInfo);

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

		const exists = await authService.userExists(email, username);
		if (exists) {
			return errorResponse(
				c,
				"User already exists",
				["User already exists"],
				400,
			);
		}

		const user = await authService.registerUser({
			email,
			password,
			fullName,
			username,
		});

		return successResponse(c, "Register successful", {
			user: toUserResponseSchema(user),
		});
	} catch (error) {
		return catchError(error);
	}
};

export const logoutHandler: AppRouteHandler<LogoutRoutes> = async (c) => {
	try {
		const token = c.var.token;

		if (!token) {
			return errorResponse(
				c,
				"User is not logged in",
				["User is not logged in"],
				401,
			);
		}

		const session = await sessionService.findSessionByToken(token);

		if (!session) {
			return errorResponse(
				c,
				"User is not logged in",
				["User is not logged in"],
				401,
			);
		}

		await sessionService.deleteSession(token);

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

		if (!userId || !token) {
			return errorResponse(c, "Unauthorized", ["Unauthorized"], 401);
		}

		const sessions = await sessionService.getUserSessions(userId, token);

		return successResponse(c, "Sessions retrieved successfully", {
			sessions,
		});
	} catch (error) {
		return catchError(error);
	}
};

export const getMeHandler: AppRouteHandler<GetMeRoutes> = async (c) => {
	try {
		const userId = c.var.userId;

		if (!userId) {
			return errorResponse(c, "Unauthorized", ["Unauthorized"], 401);
		}

		const user = await authService.findUserById(userId);

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

		const user = await authService.findUserByEmail(email);

		if (!user) {
			return errorResponse(c, "User not found", ["User not found"], 404);
		}

		const result = await passwordResetService.requestPasswordReset(user.id);

		if (!result) {
			return errorResponse(
				c,
				"You must wait 5 minutes before requesting a new token",
				["You must wait 5 minutes before requesting a new token"],
				400,
			);
		}

		// TODO: Send email to user with reset password token
		// await sendPasswordResetEmailAsync([user.email], result.token);

		return successResponse(c, "Forgot password successful", {
			token: result.token,
		});
	} catch (error) {
		return catchError(error);
	}
};

export const resetPasswordHandler: AppRouteHandler<
	ResetPasswordRoutes
> = async (c) => {
	try {
		const { token, password } = c.req.valid("json");

		const result = await passwordResetService.resetPassword(token, password);

		if (result.error) {
			switch (result.error) {
				case "TOKEN_NOT_FOUND":
					return errorResponse(c, "Token not found", ["Token not found"], 404);
				case "TOKEN_ALREADY_USED":
					return errorResponse(
						c,
						"Token already used",
						["Token already used"],
						400,
					);
				case "INVALID_TOKEN":
					return errorResponse(c, "Invalid token", ["Invalid token"], 400);
				case "TOKEN_EXPIRED":
					return errorResponse(c, "Token expired", ["Token expired"], 400);
				case "ACCOUNT_NOT_FOUND":
					return errorResponse(
						c,
						"Account not found",
						["Account not found"],
						400,
					);
				default:
					return errorResponse(
						c,
						"Error resetting password",
						["Error resetting password"],
						400,
					);
			}
		}

		return successResponse(c, "Reset password successful", true);
	} catch (error) {
		return catchError(error);
	}
};
