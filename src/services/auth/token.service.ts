import { sign, verify } from "hono/jwt";
import prisma from "prisma";
import type { User } from "prisma/generated/client";
import { env } from "../../config/env";

export interface TokenPayload {
	id: string;
	email: string;
	role: string;
	expires: string;
	[key: string]: string | number | undefined;
}

export interface TokenResult {
	token: string;
	expires: Date;
	refreshToken?: string;
	refreshExpires?: Date;
}

export const createTokenPayload = (user: User, expires: Date): TokenPayload => {
	return {
		id: user.id,
		email: user.email,
		role: user.role,
		expires: expires.toISOString(),
	};
};

export const generateAccessToken = async (
	user: User,
): Promise<{ token: string; expires: Date }> => {
	const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 2); // 2 days
	const payload = createTokenPayload(user, expires);
	const token = await sign(payload, env.JWT_SECRET, "HS256");

	return { token, expires };
};

export const generateRefreshToken = async (
	user: User,
): Promise<{ token: string; expires: Date }> => {
	const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); // 30 days
	const payload = createTokenPayload(user, expires);
	const token = await sign(payload, env.JWT_SECRET, "HS256");

	return { token, expires };
};

export const generateAuthTokens = async (user: User): Promise<TokenResult> => {
	const { token, expires } = await generateAccessToken(user);
	const { token: refreshToken, expires: refreshExpires } =
		await generateRefreshToken(user);

	return {
		token,
		expires,
		refreshToken,
		refreshExpires,
	};
};

export const generatePasswordResetToken = async (
	user: User,
): Promise<{ token: string; expires: Date }> => {
	const expires = new Date(Date.now() + 1000 * 60 * 5); // 5 minutes
	const payload = createTokenPayload(user, expires);
	const token = await sign(payload, env.JWT_SECRET, "HS256");

	return { token, expires };
};

export const generateEmailVerificationToken = async (
	user: User,
): Promise<string> => {
	const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 2); // 2 days
	const payload = createTokenPayload(user, expires);
	const token = await sign(payload, env.JWT_SECRET, "HS256");

	return token;
};

export const verifyToken = async (
	token: string,
): Promise<TokenPayload & { exp: number }> => {
	const payload = await verify(token, env.JWT_SECRET, "HS256");
	return payload as unknown as TokenPayload & { exp: number };
};

export const findToken = async (token: string) => {
	return prisma.session.findUnique({
		where: { sessionToken: token },
		include: {
			user: true,
		},
	});
};

export const findRefreshToken = async (token: string) => {
	return prisma.session.findUnique({
		where: { refreshToken: token },
		include: {
			user: true,
		},
	});
};
