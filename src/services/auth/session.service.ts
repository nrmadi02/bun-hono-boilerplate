import prisma from "prisma";
import type { DeviceInfo } from "./device.service";

const MAX_SESSIONS = 5;

export const cleanupExpiredSessions = async (userId: string): Promise<void> => {
	await prisma.session.deleteMany({
		where: {
			userId,
			expireAt: {
				lt: new Date(),
			},
		},
	});
};

export const getActiveSessions = async (userId: string) => {
	return prisma.session.findMany({
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
};

export const manageUserSessions = async (
	userId: string,
	maxSessions: number = MAX_SESSIONS,
): Promise<void> => {
	await cleanupExpiredSessions(userId);

	const activeSessions = await getActiveSessions(userId);

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

export const createSession = async (
	token: string,
	expires: Date,
	userId: string,
	deviceInfo: DeviceInfo,
	refreshToken?: string,
	refreshTokenExpiresAt?: Date,
): Promise<void> => {
	await prisma.session.create({
		data: {
			sessionToken: token,
			expireAt: expires,
			userId,
			deviceName: deviceInfo.deviceName,
			ipAddress: deviceInfo.ipAddress,
			userAgent: deviceInfo.userAgent,
			refreshToken,
			refreshTokenExpiresAt,
		},
	});
};

export const updateSession = async (
	token: string,
	expires: Date,
	deviceInfo: DeviceInfo,
	refreshToken?: string,
	refreshTokenExpiresAt?: Date,
	sessionId?: string,
): Promise<void> => {
	await prisma.session.update({
		where: {
			id: sessionId,
		},
		data: {
			expireAt: expires,
			sessionToken: token,
			deviceName: deviceInfo.deviceName,
			ipAddress: deviceInfo.ipAddress,
			userAgent: deviceInfo.userAgent,
			refreshToken,
			refreshTokenExpiresAt,
		},
	});
};

export const deleteSession = async (token: string): Promise<void> => {
	await prisma.session.delete({
		where: {
			sessionToken: token,
		},
	});
};

export const findSessionByToken = async (token: string) => {
	return prisma.session.findUnique({
		where: {
			sessionToken: token,
		},
	});
};

export const getSessionById = async (id: string) => {
	return prisma.session.findUnique({
		where: {
			id,
		},
	});
};

export const getUserSessions = async (userId: string, currentToken: string) => {
	await cleanupExpiredSessions(userId);

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

	return sessions.map((session) => ({
		id: session.id,
		deviceName: session.deviceName,
		ipAddress: session.ipAddress,
		userAgent: session.userAgent,
		createdAt: session.createdAt.toISOString(),
		expireAt: session.expireAt.toISOString(),
		isCurrent: session.sessionToken === currentToken,
	}));
};

export const deleteAllUserSessions = async (userId: string): Promise<void> => {
	await prisma.session.deleteMany({
		where: { userId },
	});
};
