/**
 * Auth Register API Tests
 * POST /api/v1/auth/register
 */

import { beforeEach, describe, expect, it } from "vitest";
import prisma from "../../../prisma";
import { clearRateLimits } from "../../helpers/clear-rate-limit";
import { getTestApp } from "../../helpers/test-app";
import { mockRegisterBody } from "../../helpers/test-factories";

const app = getTestApp();

describe("POST /api/v1/auth/register", () => {
	beforeEach(async () => {
		// Clear rate limits before each test
		await clearRateLimits();
	});

	it("should register new user with valid data", async () => {
		const userData = mockRegisterBody();

		const response = await app.request("/api/v1/auth/register", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(userData),
		});

		expect(response.status).toBe(200);

		const data = await response.json();
		expect(data.success).toBe(true);
		expect(data.message).toBe("Register successful");
		expect(data.data.user).toBeDefined();
		expect(data.data.user.email).toBe(userData.email);
		expect(data.data.user.username).toBe(userData.username);
		expect(data.data.user.fullName).toBe(userData.fullName);
		expect(data.data.user.emailVerified).toBe(false);

		// Verify user was created in database
		const dbUser = await prisma.user.findUnique({
			where: { email: userData.email },
		});
		expect(dbUser).toBeDefined();
		expect(dbUser?.email).toBe(userData.email);
	});

	it("should reject registration with duplicate email", async () => {
		const userData = mockRegisterBody({
			email: "duplicate@example.com",
		});

		// Register first user
		await app.request("/api/v1/auth/register", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(userData),
		});

		// Try to register with same email
		const response = await app.request("/api/v1/auth/register", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(userData),
		});

		expect(response.status).toBe(400);

		const data = await response.json();
		expect(data.success).toBe(false);
		expect(data.errors).toContain("User already exists");
	});

	it("should reject registration with duplicate username", async () => {
		const userData1 = mockRegisterBody({
			username: "testuser123",
		});

		// Register first user
		await app.request("/api/v1/auth/register", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(userData1),
		});

		// Try to register with same username but different email
		const userData2 = mockRegisterBody({
			username: "testuser123",
			email: "different@example.com",
		});

		const response = await app.request("/api/v1/auth/register", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(userData2),
		});

		expect(response.status).toBe(400);

		const data = await response.json();
		expect(data.success).toBe(false);
		expect(data.errors).toContain("User already exists");
	});

	it("should reject registration with invalid email format", async () => {
		const userData = mockRegisterBody({
			email: "invalid-email",
		});

		const response = await app.request("/api/v1/auth/register", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(userData),
		});

		expect(response.status).toBe(422); // Zod validation error

		const data = await response.json();
		expect(data.success).toBe(false);
	});

	it("should reject registration with weak password", async () => {
		const userData = mockRegisterBody({
			password: "weak",
		});

		const response = await app.request("/api/v1/auth/register", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(userData),
		});

		expect(response.status).toBe(422); // Zod validation error

		const data = await response.json();
		expect(data.success).toBe(false);
	});

	it("should reject registration with missing required fields", async () => {
		const response = await app.request("/api/v1/auth/register", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				email: "test@example.com",
				// Missing password, username, fullName
			}),
		});

		expect(response.status).toBe(422); // Zod validation error

		const data = await response.json();
		expect(data.success).toBe(false);
	});

	it("should create user account with hashed password", async () => {
		const userData = mockRegisterBody();

		await app.request("/api/v1/auth/register", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(userData),
		});

		// Check that password is hashed in database
		const user = await prisma.user.findUnique({
			where: { email: userData.email },
			include: { accounts: true },
		});

		expect(user).toBeDefined();
		expect(user?.accounts[0].password).toBeDefined();
		expect(user?.accounts[0].password).not.toBe(userData.password);
		expect(user?.accounts[0].password?.length).toBeGreaterThan(20); // Bcrypt hash length
	});

	it("should set default user role", async () => {
		const userData = mockRegisterBody();

		await app.request("/api/v1/auth/register", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(userData),
		});

		const user = await prisma.user.findUnique({
			where: { email: userData.email },
		});

		expect(user?.role).toBe("user");
	});
});
