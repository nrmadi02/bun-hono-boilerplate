import { createRoute } from "@hono/zod-openapi";
import { errorResponseOpenAPIObjectConfig } from "../../lib/open-api";
import {
	forgotPasswordSchema,
	loginSchema,
	registerSchema,
	resendEmailVerificationSchema,
	resetPasswordSchema,
	verifyEmailSchema,
} from "../../schemas/auth/auth.schema";
import {
	forgotPasswordResponseSchema,
	getMeResponseSchema,
	loginResponseSchema,
	logoutResponseSchema,
	refreshTokenResponseSchema,
	registerResponseSchema,
	resendEmailVerificationResponseSchema,
	resetPasswordResponseSchema,
	sessionsResponseSchema,
	verifyEmailResponseSchema,
} from "../../schemas/auth/auth-response.schema";
import { baseResponseSchema } from "../../schemas/base.schema";
import { validateRefreshToken, validateToken } from "../../middlewares/auth.middleware";
import { casbinMiddleware } from "../../middlewares/casbin.middleware";
import { authLimiter, passwordResetLimiter } from "../../middlewares/rate-limit.middleware";

export const loginRoutes = createRoute({
	path: "/auth/login",
	method: "post",
	tags: ["Auth"],
	description: "Login to the system",
	request: {
		body: {
			content: {
				"application/json": {
					schema: loginSchema,
				},
			},
		},
	},
	responses: {
		200: {
			description: "Login successful",
			content: {
				"application/json": {
					schema: baseResponseSchema(loginResponseSchema),
				},
			},
		},
		400: errorResponseOpenAPIObjectConfig("Error logging in"),
		422: errorResponseOpenAPIObjectConfig("The validation error(s)"),
		404: errorResponseOpenAPIObjectConfig("User not found"),
		500: errorResponseOpenAPIObjectConfig("Internal server error"),
	},
	middleware: [authLimiter],
});

export const registerRoutes = createRoute({
	path: "/auth/register",
	method: "post",
	tags: ["Auth"],
	description: "Register a new user",
	request: {
		body: {
			content: {
				"application/json": {
					schema: registerSchema,
				},
			},
		},
	},
	responses: {
		200: {
			description: "Register successful",
			content: {
				"application/json": {
					schema: baseResponseSchema(registerResponseSchema),
				},
			},
		},
		400: errorResponseOpenAPIObjectConfig("Error registering user"),
		422: errorResponseOpenAPIObjectConfig("The validation error(s)"),
		500: errorResponseOpenAPIObjectConfig("Internal server error"),
	},
	middleware: [authLimiter],
});

export const refreshTokenRoutes = createRoute({
	path: "/auth/refresh",
	method: "patch",
	tags: ["Auth"],
	description: "Refresh access token",
	responses: {
		200: {
			description: "Token refreshed successfully",
			content: {
				"application/json": {
					schema: baseResponseSchema(refreshTokenResponseSchema),
				},
			},
		},
		404: errorResponseOpenAPIObjectConfig("Refresh token not found"),
		400: errorResponseOpenAPIObjectConfig("Invalid refresh token"),
		401: errorResponseOpenAPIObjectConfig("Unauthorized"),
		500: errorResponseOpenAPIObjectConfig("Internal server error"),
	},
	middleware: [validateRefreshToken, authLimiter],
});

export const logoutRoutes = createRoute({
	path: "/auth/logout",
	method: "post",
	tags: ["Auth"],
	description: "Logout from current session or specific device",
	security: [{ Bearer: [] }],
	responses: {
		200: {
			description: "Logout successful",
			content: {
				"application/json": {
					schema: baseResponseSchema(logoutResponseSchema),
				},
			},
		},
		401: errorResponseOpenAPIObjectConfig("Unauthorized"),
		404: errorResponseOpenAPIObjectConfig("Session not found"),
		500: errorResponseOpenAPIObjectConfig("Internal server error"),
	},
	middleware: [validateToken],
});

export const getSessionsRoutes = createRoute({
	path: "/auth/sessions",
	method: "get",
	tags: ["Auth"],
	description: "Get all active sessions for current user",
	security: [{ Bearer: [] }],
	responses: {
		200: {
			description: "Sessions retrieved successfully",
			content: {
				"application/json": {
					schema: baseResponseSchema(sessionsResponseSchema),
				},
			},
		},
		401: errorResponseOpenAPIObjectConfig("Unauthorized"),
		500: errorResponseOpenAPIObjectConfig("Internal server error"),
	},
	middleware: [validateToken, casbinMiddleware("users", "read")],
});

export const getMeRoutes = createRoute({
	path: "/auth/me",
	method: "get",
	tags: ["Auth"],
	description: "Get current user",
	security: [{ Bearer: [] }],
	responses: {
		200: {
			description: "User retrieved successfully",
			content: {
				"application/json": {
					schema: baseResponseSchema(getMeResponseSchema),
				},
			},
		},
		404: errorResponseOpenAPIObjectConfig("User not found"),
		401: errorResponseOpenAPIObjectConfig("Unauthorized"),
		500: errorResponseOpenAPIObjectConfig("Internal server error"),
	},
	middleware: [validateToken, casbinMiddleware("users", "read")],
});

export const forgotPasswordRoutes = createRoute({
	path: "/auth/forgot-password",
	method: "post",
	tags: ["Auth"],
	description: "Forgot password",
	request: {
		body: {
			content: {
				"application/json": {
					schema: forgotPasswordSchema,
				},
			},
		},
	},
	responses: {
		200: {
			description: "Forgot password successful",
			content: {
				"application/json": {
					schema: baseResponseSchema(forgotPasswordResponseSchema),
				},
			},
		},
		400: errorResponseOpenAPIObjectConfig("Error forgetting password"),
		422: errorResponseOpenAPIObjectConfig("The validation error(s)"),
		404: errorResponseOpenAPIObjectConfig("User not found"),
		500: errorResponseOpenAPIObjectConfig("Internal server error"),
	},
	middleware: [passwordResetLimiter],
});

export const resetPasswordRoutes = createRoute({
	path: "/auth/reset-password",
	method: "post",
	tags: ["Auth"],
	description: "Reset password",
	request: {
		body: {
			content: {
				"application/json": {
					schema: resetPasswordSchema,
				},
			},
		},
	},
	responses: {
		200: {
			description: "Reset password successful",
			content: {
				"application/json": {
					schema: baseResponseSchema(resetPasswordResponseSchema),
				},
			},
		},
		404: errorResponseOpenAPIObjectConfig("Token not found"),
		400: errorResponseOpenAPIObjectConfig("Error resetting password"),
		422: errorResponseOpenAPIObjectConfig("The validation error(s)"),
		500: errorResponseOpenAPIObjectConfig("Internal server error"),
	},
	middleware: [passwordResetLimiter],
});

export const resendEmailVerificationRoutes = createRoute({
	path: "/auth/resend-verification",
	method: "post",
	tags: ["Auth"],
	description: "Resend email verification",
	request: {
		body: {
			content: {
				"application/json": {
					schema: resendEmailVerificationSchema,
				},
			},
		},
	},
	responses: {
		200: {
			description: "Email verification sent successfully",
			content: {
				"application/json": {
					schema: baseResponseSchema(resendEmailVerificationResponseSchema),
				},
			},
		},
		400: errorResponseOpenAPIObjectConfig("Error resending email verification"),
		404: errorResponseOpenAPIObjectConfig("User not found"),
		422: errorResponseOpenAPIObjectConfig("The validation error(s)"),
		500: errorResponseOpenAPIObjectConfig("Internal server error"),
	},
	middleware: [authLimiter],
});

export const verifyEmailRoutes = createRoute({
	path: "/auth/verify-email",
	method: "post",
	tags: ["Auth"],
	description: "Verify email address",
	request: {
		body: {
			content: {
				"application/json": {
					schema: verifyEmailSchema,
				},
			},
		},
	},
	responses: {
		200: {
			description: "Email verified successfully",
			content: {
				"application/json": {
					schema: baseResponseSchema(verifyEmailResponseSchema),
				},
			},
		},
		400: errorResponseOpenAPIObjectConfig("Error verifying email"),
		404: errorResponseOpenAPIObjectConfig("User not found"),
		422: errorResponseOpenAPIObjectConfig("The validation error(s)"),
		500: errorResponseOpenAPIObjectConfig("Internal server error"),
	},
	middleware: [authLimiter],
});

export type LoginRoutes = typeof loginRoutes;
export type RegisterRoutes = typeof registerRoutes;
export type LogoutRoutes = typeof logoutRoutes;
export type GetSessionsRoutes = typeof getSessionsRoutes;
export type GetMeRoutes = typeof getMeRoutes;
export type ForgotPasswordRoutes = typeof forgotPasswordRoutes;
export type ResetPasswordRoutes = typeof resetPasswordRoutes;
export type RefreshTokenRoutes = typeof refreshTokenRoutes;
export type ResendEmailVerificationRoutes = typeof resendEmailVerificationRoutes;
export type VerifyEmailRoutes = typeof verifyEmailRoutes;