/**
 * Auth Me API Tests
 * GET /api/v1/auth/me
 */

import { faker } from "@faker-js/faker";
import { beforeEach, describe, expect, it } from "vitest";
import prisma from "../../../prisma";
import { generateAccessToken } from "../../../src/services/auth/token.service";
import { clearRateLimits } from "../../helpers/clear-rate-limit";
import { createAuthHeader, getTestApp } from "../../helpers/test-app";
import { createTestUser } from "../../helpers/test-factories";

const app = getTestApp();

describe("GET /api/v1/auth/me", () => {
	let testUser: Awaited<ReturnType<typeof createTestUser>>;
	let token: string;

	beforeEach(async () => {
		// Clear rate limits before each test
		await clearRateLimits();

		// Create test user with random email
		testUser = await createTestUser({
			email: faker.internet.email(),
			emailVerified: true,
		});

		// Generate token for user
		const { token: accessToken, expires } = await generateAccessToken(
			testUser.user,
		);
		token = accessToken;

		// Create session in database (required by auth middleware)
		await prisma.session.create({
			data: {
				sessionToken: token,
				userId: testUser.user.id,
				expireAt: expires,
				deviceName: "Test Device",
				ipAddress: "127.0.0.1",
				userAgent: "Test Agent",
			},
		});
	});

	it("should return current user with valid token", async () => {
		const response = await app.request("/api/v1/auth/me", {
			method: "GET",
			headers: createAuthHeader(token),
		});

		expect(response.status).toBe(200);

		const data = await response.json();
		expect(data.success).toBe(true);
		expect(data.data.user).toBeDefined();
		expect(data.data.user.id).toBe(testUser.user.id);
		expect(data.data.user.email).toBe(testUser.user.email);
		expect(data.data.user.username).toBe(testUser.user.username);
		expect(data.data.user.fullName).toBe(testUser.user.fullName);
		expect(data.data.user.role).toBe(testUser.user.role);
	});

	it("should reject request without authorization header", async () => {
		const response = await app.request("/api/v1/auth/me", {
			method: "GET",
		});

		expect(response.status).toBe(401);

		const data = await response.json();
		expect(data.success).toBe(false);
		expect(data.errors).toContain("Unauthorized - No token provided");
	});

	it("should reject request with invalid token", async () => {
		const response = await app.request("/api/v1/auth/me", {
			method: "GET",
			headers: createAuthHeader("invalid-token"),
		});

		expect(response.status).toBe(401);

		const data = await response.json();
		expect(data.success).toBe(false);
	});

	it("should reject request with malformed token", async () => {
		const malformedToken = "Bearer.malformed.token";

		const response = await app.request("/api/v1/auth/me", {
			method: "GET",
			headers: createAuthHeader(malformedToken),
		});

		expect(response.status).toBe(401);
	});

	it("should not return password in response", async () => {
		const response = await app.request("/api/v1/auth/me", {
			method: "GET",
			headers: createAuthHeader(token),
		});

		const data = await response.json();
		expect(data.data.user.password).toBeUndefined();
	});

	it("should return user with correct role", async () => {
		// Create admin user with random email
		const adminUser = await createTestUser({
			email: faker.internet.email(),
			role: "admin",
			emailVerified: true,
		});

		const { token: adminToken, expires } = await generateAccessToken(
			adminUser.user,
		);

		// Create session for admin token
		await prisma.session.create({
			data: {
				sessionToken: adminToken,
				userId: adminUser.user.id,
				expireAt: expires,
				deviceName: "Test Device",
				ipAddress: "127.0.0.1",
				userAgent: "Test Agent",
			},
		});

		const response = await app.request("/api/v1/auth/me", {
			method: "GET",
			headers: createAuthHeader(adminToken),
		});

		const data = await response.json();
		expect(data.data.user.role).toBe("admin");
	});
});
