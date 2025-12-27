/**
 * Test Data Factories
 * Generate test data using Faker
 */

import { faker } from "@faker-js/faker";
import Bun from "bun";
import prisma from "../../prisma";
import type { User } from "../../prisma/generated/client";

/**
 * Generate mock user data
 */
export function mockUserData(overrides?: Partial<User>) {
	return {
		id: faker.string.uuid(),
		username: faker.internet.username(),
		fullName: faker.person.fullName(),
		email: faker.internet.email(),
		role: "user",
		emailVerified: false,
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	};
}

/**
 * Create user in test database
 */
export async function createTestUser(data?: {
	email?: string;
	password?: string;
	username?: string;
	fullName?: string;
	role?: string;
	emailVerified?: boolean;
}) {
	const email = data?.email || faker.internet.email();
	const password = data?.password || "Password123!";
	const username = data?.username || faker.internet.username();
	const fullName = data?.fullName || faker.person.fullName();
	const role = data?.role || "user";
	const emailVerified = data?.emailVerified ?? false;

	// Hash password
	const hashedPassword = await Bun.password.hash(password, {
		algorithm: "bcrypt",
		cost: 10,
	});

	// Create user
	const user = await prisma.user.create({
		data: {
			email,
			username,
			fullName,
			role,
			emailVerified,
		},
	});

	// Create account with password
	await prisma.account.create({
		data: {
			userId: user.id,
			provider: "EMAIL",
			password: hashedPassword,
		},
	});

	return {
		user,
		password, // Return plain password for testing
	};
}

/**
 * Create admin user
 */
export async function createTestAdmin(data?: {
	email?: string;
	password?: string;
	username?: string;
	fullName?: string;
}) {
	return createTestUser({
		...data,
		role: "admin",
		emailVerified: true,
	});
}

/**
 * Generate register request body
 */
export function mockRegisterBody(overrides?: {
	email?: string;
	password?: string;
	username?: string;
	fullName?: string;
}) {
	return {
		email: overrides?.email || faker.internet.email(),
		password: overrides?.password || "SecurePass123!",
		username: overrides?.username || faker.internet.username(),
		fullName: overrides?.fullName || faker.person.fullName(),
	};
}

/**
 * Generate login request body
 */
export function mockLoginBody(email: string, password: string) {
	return {
		email,
		password,
	};
}
