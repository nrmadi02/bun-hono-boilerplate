import z from "zod";
import { userResponseSchema } from "../user/user-response.schema";

export const loginResponseSchema = z.object({
	token: z.string(),
	refreshToken: z.string(),
	user: userResponseSchema,
});

export const registerResponseSchema = z.object({
	user: userResponseSchema,
});

export const sessionSchema = z.object({
	id: z.string(),
	deviceName: z.string().nullable(),
	ipAddress: z.string().nullable(),
	userAgent: z.string().nullable(),
	createdAt: z.string(),
	expireAt: z.string(),
	isCurrent: z.boolean().optional(),
});

export const sessionsResponseSchema = z.object({
	sessions: z.array(sessionSchema),
});

export const logoutResponseSchema = z.object({
	message: z.string(),
});

export const forgotPasswordResponseSchema = z.object({
	token: z.string(),
});
export const resetPasswordResponseSchema = z.boolean();

export const getMeResponseSchema = z.object({
	user: userResponseSchema,
});
export const refreshTokenResponseSchema = logoutResponseSchema;

export const resendEmailVerificationResponseSchema = z.object({
	token: z.string(),
});

export const verifyEmailResponseSchema = z.object({
	user: userResponseSchema,
});
