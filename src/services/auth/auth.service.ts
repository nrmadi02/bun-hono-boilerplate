import prisma from "prisma";
import type { Prisma } from "prisma/generated/client";
import { Provider } from "prisma/generated/enums";
import { sendVerificationEmailAsync } from "../../tasks/email/clients/send-email-async";
import { tokenService } from ".";
import {
	generateAuthTokens,
	generateEmailVerificationToken,
} from "./token.service";

export const findUserByEmail = async (email: string) => {
	return prisma.user.findUnique({
		where: { email },
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
};

export const verifyPassword = async (
	password: string,
	hashedPassword: string,
): Promise<boolean> => {
	return Bun.password.verify(password, hashedPassword);
};

export const hashPassword = async (password: string): Promise<string> => {
	return Bun.password.hash(password);
};

export const userExists = async (
	email: string,
	username: string,
): Promise<boolean> => {
	const existingUser = await prisma.user.findFirst({
		where: {
			OR: [
				{ email: email.toLowerCase() },
				{ username: username.toLowerCase() },
			],
		} as Prisma.UserWhereInput,
	});

	return !!existingUser;
};

export const createUser = async (data: {
	email: string;
	password: string;
	fullName: string;
	username: string;
}) => {
	const hashedPassword = await hashPassword(data.password);

	return prisma.user.create({
		data: {
			email: data.email,
			fullName: data.fullName,
			username: data.username,
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
};

export const findUserById = async (userId: string) => {
	return prisma.user.findUnique({
		where: { id: userId },
	});
};

export const loginUser = async (email: string, password: string) => {
	const user = await findUserByEmail(email);

	if (!user) {
		return null;
	}

	if (!user.accounts[0]?.password) {
		return null;
	}

	const isPasswordValid = await verifyPassword(
		password,
		user.accounts[0].password,
	);

	if (!isPasswordValid) {
		return null;
	}

	const tokens = await generateAuthTokens(user);

	return {
		user,
		...tokens,
	};
};

export const registerUser = async (data: {
	email: string;
	password: string;
	fullName: string;
	username: string;
}) => {
	const user = await createUser(data);
	const token = await generateEmailVerificationToken(user);
	const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 2);

	await prisma.emailVerification.create({
		data: {
			userId: user.id,
			token,
			expiresAt,
		},
	});

	await sendVerificationEmailAsync([user.email], token);

	return user;
};

export const loginUserByRefreshToken = async (refreshToken?: string) => {
	if (!refreshToken) {
		return null;
	}

	const token = await tokenService.findRefreshToken(refreshToken);

	if (
		!token ||
		!token.refreshTokenExpiresAt ||
		token.refreshTokenExpiresAt < new Date()
	) {
		return null;
	}

	const newTokens = await generateAuthTokens(token.user);

	return {
		id: token.id,
		user: token.user,
		...newTokens,
	};
};
