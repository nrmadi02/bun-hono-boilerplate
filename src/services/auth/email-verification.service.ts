import prisma from "prisma";
import { generateEmailVerificationToken, verifyToken } from "./token.service";
import { sendVerificationEmailAsync } from "../../tasks/email/clients/send-email-async";

export const findUserByEmail = async (email: string) => {
	return prisma.user.findUnique({
		where: { email },
	});
};

export const isTokenExpired = (expiresAt: string): boolean => {
	return new Date(expiresAt) < new Date();
};

export const findLatestEmailVerification = async (userId: string) => {
	return prisma.emailVerification.findFirst({
		where: { userId },
		orderBy: { createdAt: "desc" },
	});
};

export const createEmailVerification = async (userId: string, token: string, expiresAt: Date) => {
	return prisma.emailVerification.create({
		data: {
			userId,
			token,
			expiresAt,
		},
	});
};

export const resendEmailVerification = async (email: string) => {
	const user = await findUserByEmail(email);

	if (!user) {
		return { error: "USER_NOT_FOUND" };
	}

	if (user.emailVerified) {
		return { error: "EMAIL_ALREADY_VERIFIED" };
	}

	const latestVerification = await findLatestEmailVerification(user.id);

	if (latestVerification) {
		const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
		if (latestVerification.createdAt > fiveMinutesAgo) {
			return { error: "WAIT_5_MINUTES" };
		}
	}

	const newToken = await generateEmailVerificationToken(user);
	const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 2);
	
	await createEmailVerification(user.id, newToken, expiresAt);
	await sendVerificationEmailAsync([user.email], newToken);

	return { success: true, token: newToken };
};

export const verifyEmail = async (token: string) => {
	let verifiedToken;
	try {
		verifiedToken = await verifyToken(token);
	} catch {
		return { error: "INVALID_TOKEN" };
	}

	const isExpired = isTokenExpired(verifiedToken.expires);
	if (isExpired) {
		return { error: "TOKEN_EXPIRED" };
	}

	const user = await prisma.user.findUnique({
		where: { id: verifiedToken.id },
	});

	if (!user) {
		return { error: "USER_NOT_FOUND" };
	}

	if (user.emailVerified) {
		return { error: "EMAIL_ALREADY_VERIFIED" };
	}

	await prisma.user.update({
		where: { id: user.id },
		data: { emailVerified: true },
	});

	return { success: true, user };
};
