/**
 * Auth Login API Tests
 * POST /api/v1/auth/login
 */

import { faker } from "@faker-js/faker";
import { beforeEach, describe, expect, it } from "vitest";
import { clearRateLimits } from "../../helpers/clear-rate-limit";
import { getTestApp } from "../../helpers/test-app";
import { createTestUser, mockLoginBody } from "../../helpers/test-factories";

const app = getTestApp();

describe("POST /api/v1/auth/login", () => {
	let testUser: Awaited<ReturnType<typeof createTestUser>>;

	beforeEach(async () => {
		// Clear rate limits before each test
		await clearRateLimits();

		// Create test user before each test with random email
		testUser = await createTestUser({
			email: faker.internet.email(),
			password: "Password123!",
			emailVerified: true,
		});
	});

	it("should login with valid credentials", async () => {
		const loginData = mockLoginBody(testUser.user.email, testUser.password);

		const response = await app.request("/api/v1/auth/login", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(loginData),
		});

		expect(response.status).toBe(200);

		const data = await response.json();
		expect(data.success).toBe(true);
		expect(data.message).toBe("Login successful");
		expect(data.data.token).toBeDefined();
		expect(data.data.refreshToken).toBeDefined();
		expect(data.data.user).toBeDefined();
		expect(data.data.user.email).toBe(testUser.user.email);
		expect(data.data.user.id).toBe(testUser.user.id);

		// Verify token format (JWT)
		expect(data.data.token).toMatch(/^eyJ/);
		expect(data.data.refreshToken).toMatch(/^eyJ/);
	});

	it("should reject login with invalid email", async () => {
		const loginData = mockLoginBody("nonexistent@example.com", "Password123!");

		const response = await app.request("/api/v1/auth/login", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(loginData),
		});

		expect(response.status).toBe(400);

		const data = await response.json();
		expect(data.success).toBe(false);
		expect(data.errors).toContain("Invalid credentials");
	});

	it("should reject login with invalid password", async () => {
		const loginData = mockLoginBody(testUser.user.email, "WrongPassword!");

		const response = await app.request("/api/v1/auth/login", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(loginData),
		});

		expect(response.status).toBe(400);

		const data = await response.json();
		expect(data.success).toBe(false);
		expect(data.errors).toContain("Invalid credentials");
	});

	it("should login successfully even with unverified email", async () => {
		// Create unverified user with random email
		const unverifiedUser = await createTestUser({
			email: faker.internet.email(),
			password: "Password123!",
			emailVerified: false,
		});

		const loginData = mockLoginBody(
			unverifiedUser.user.email,
			unverifiedUser.password,
		);

		const response = await app.request("/api/v1/auth/login", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(loginData),
		});

		// Note: Current implementation allows login without email verification
		expect(response.status).toBe(200);

		const data = await response.json();
		expect(data.success).toBe(true);
		expect(data.data.token).toBeDefined();
	});

	it("should reject login with missing credentials", async () => {
		const response = await app.request("/api/v1/auth/login", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				email: "test@example.com",
				// Missing password
			}),
		});

		expect(response.status).toBe(422); // Zod validation error

		const data = await response.json();
		expect(data.success).toBe(false);
	});

	it("should create session on successful login", async () => {
		const loginData = mockLoginBody(testUser.user.email, testUser.password);

		const response = await app.request("/api/v1/auth/login", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"User-Agent": "Test Browser",
			},
			body: JSON.stringify(loginData),
		});

		expect(response.status).toBe(200);

		// Verify session was created in database
		const prisma = (await import("../../../prisma")).default;
		const sessions = await prisma.session.findMany({
			where: { userId: testUser.user.id },
		});

		expect(sessions.length).toBeGreaterThan(0);
		expect(sessions[0].userAgent).toBe("Test Browser");
	});

	it("should return user data without password", async () => {
		const loginData = mockLoginBody(testUser.user.email, testUser.password);

		const response = await app.request("/api/v1/auth/login", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(loginData),
		});

		const data = await response.json();

		expect(data.data.user).toBeDefined();
		expect(data.data.user.password).toBeUndefined();
		expect(data.data.user.email).toBe(testUser.user.email);
		expect(data.data.user.username).toBe(testUser.user.username);
	});
});
