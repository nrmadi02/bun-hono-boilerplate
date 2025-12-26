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
	RefreshTokenRoutes,
	RegisterRoutes,
	ResendEmailVerificationRoutes,
	ResetPasswordRoutes,
	VerifyEmailRoutes,
} from "./auth.routes";
import * as authService from "../../services/auth/auth.service";
import * as sessionService from "../../services/auth/session.service";
import * as passwordResetService from "../../services/auth/password-reset.service";
import * as emailVerificationService from "../../services/auth/email-verification.service";
import * as deviceService from "../../services/auth/device.service";
import { sendResetPasswordEmailAsync } from "../../tasks/email/clients/send-email-async";

export const loginHandler: AppRouteHandler<LoginRoutes> = async (c) => {
	try {
		const { email, password } = c.req.valid("json");

		const result = await authService.loginUser(email, password);

		if (!result) {
			return errorResponse(c, "Invalid credentials", ["Invalid credentials"], 400);
		}

		const { user, token, expires, refreshToken, refreshExpires } = result;
		const deviceInfo = deviceService.getDeviceInfo(c);

		await sessionService.manageUserSessions(user.id);
		await sessionService.createSession(token, expires, user.id, deviceInfo, refreshToken, refreshExpires);

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

export const refreshTokenHandler: AppRouteHandler<RefreshTokenRoutes> = async (c) => {
	try {
		const refreshToken = c.var.refreshToken;

		const result = await authService.loginUserByRefreshToken(refreshToken);
	
		if (!result) {
			return errorResponse(c, "Invalid refresh token", ["Invalid refresh token"], 400);
		}

		const { user, token, expires, refreshToken: newRefreshToken, refreshExpires } = result;
		const deviceInfo = deviceService.getDeviceInfo(c);

		await sessionService.manageUserSessions(user.id);
	
		const session = await sessionService.getSessionById(result.id);
		
		if (!session) {
			await sessionService.createSession(token, expires, user.id, deviceInfo, newRefreshToken, refreshExpires);
		} else {
			await sessionService.updateSession(token, expires, deviceInfo, newRefreshToken, refreshExpires, session?.id);
		}
		
		return successResponse(c, "Login successful", {
			token,
			refreshToken: newRefreshToken,
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

		await sendResetPasswordEmailAsync([user.email], result.token);

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

export const resendEmailVerificationHandler: AppRouteHandler<
	ResendEmailVerificationRoutes
> = async (c) => {
	try {
		const { email } = c.req.valid("json");

		const result = await emailVerificationService.resendEmailVerification(email);

		if (result.error) {
			switch (result.error) {
				case "USER_NOT_FOUND":
					return errorResponse(c, "User not found", ["User not found"], 404);
				case "EMAIL_ALREADY_VERIFIED":
					return errorResponse(
						c,
						"Email already verified",
						["Email already verified"],
						400,
					);
				case "WAIT_5_MINUTES":
					return errorResponse(
						c,
						"You must wait 5 minutes before requesting a new verification email",
						["You must wait 5 minutes before requesting a new verification email"],
						400,
					);
				default:
					return errorResponse(
						c,
						"Error resending email verification",
						["Error resending email verification"],
						400,
					);
			}
		}

		return successResponse(c, "Email verification sent successfully", {
			token: result.token,
		});
	} catch (error) {
		return catchError(error);
	}
};

export const verifyEmailHandler: AppRouteHandler<VerifyEmailRoutes> = async (
	c,
) => {
	try {
		const { token } = c.req.valid("json");

		const result = await emailVerificationService.verifyEmail(token);

		if (result.error) {
			switch (result.error) {
				case "INVALID_TOKEN":
					return errorResponse(c, "Invalid token", ["Invalid token"], 400);
				case "TOKEN_EXPIRED":
					return errorResponse(c, "Token expired", ["Token expired"], 400);
				case "USER_NOT_FOUND":
					return errorResponse(c, "User not found", ["User not found"], 404);
				case "EMAIL_ALREADY_VERIFIED":
					return errorResponse(
						c,
						"Email already verified",
						["Email already verified"],
						400,
					);
				default:
					return errorResponse(
						c,
						"Error verifying email",
						["Error verifying email"],
						400,
					);
			}
		}

		return successResponse(c, "Email verified successfully", {
			user: toUserResponseSchema(result.user!),
		});
	} catch (error) {
		return catchError(error);
	}
};
