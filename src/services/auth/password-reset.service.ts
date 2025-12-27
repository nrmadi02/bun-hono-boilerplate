import prisma from "prisma";
import { hashPassword } from "./auth.service";
import { deleteAllUserSessions } from "./session.service";
import {
	generatePasswordResetToken,
	type TokenPayload,
	verifyToken,
} from "./token.service";

export const findPasswordResetByToken = async (token: string) => {
	return prisma.passwordReset.findUnique({
		where: { token },
	});
};

export const findExistingPasswordReset = async (userId: string) => {
	return prisma.passwordReset.findFirst({
		where: { userId },
	});
};

export const isPasswordResetExpired = (expiresAt: Date): boolean => {
	return expiresAt < new Date();
};

export const createPasswordResetToken = async (userId: string) => {
	const user = await prisma.user.findUnique({
		where: { id: userId },
	});

	if (!user) {
		return null;
	}

	const { token, expires } = await generatePasswordResetToken(user);

	await prisma.passwordReset.create({
		data: {
			token,
			expiresAt: expires,
			isUsed: false,
			userId,
		},
	});

	return { token, expires };
};

export const updatePasswordResetToken = async (
	resetId: string,
	userId: string,
) => {
	const user = await prisma.user.findUnique({
		where: { id: userId },
	});

	if (!user) {
		return null;
	}

	const { token, expires } = await generatePasswordResetToken(user);

	await prisma.passwordReset.update({
		where: { id: resetId },
		data: { token, expiresAt: expires, isUsed: false },
	});

	return { token, expires };
};

export const requestPasswordReset = async (userId: string) => {
	const existingReset = await findExistingPasswordReset(userId);

	if (existingReset) {
		if (isPasswordResetExpired(existingReset.expiresAt)) {
			return updatePasswordResetToken(existingReset.id, userId);
		}
		return null;
	}

	return createPasswordResetToken(userId);
};

export const resetPassword = async (token: string, newPassword: string) => {
	const passwordReset = await findPasswordResetByToken(token);

	if (!passwordReset) {
		return { error: "TOKEN_NOT_FOUND" };
	}

	if (passwordReset.isUsed) {
		return { error: "TOKEN_ALREADY_USED" };
	}

	let verifiedToken: TokenPayload;
	try {
		verifiedToken = await verifyToken(token);
	} catch {
		return { error: "INVALID_TOKEN" };
	}

	const expireAt = new Date((verifiedToken.exp as number) * 1000);
	if (expireAt < new Date()) {
		return { error: "TOKEN_EXPIRED" };
	}

	const userId = verifiedToken.id as string;

	const account = await prisma.account.findFirst({
		where: { userId },
	});

	if (!account) {
		return { error: "ACCOUNT_NOT_FOUND" };
	}

	const hashedPassword = await hashPassword(newPassword);
	await prisma.account.update({
		where: { id: account.id },
		data: { password: hashedPassword },
	});

	await prisma.passwordReset.update({
		where: { token },
		data: { isUsed: true },
	});

	await deleteAllUserSessions(userId);

	return { success: true };
};
