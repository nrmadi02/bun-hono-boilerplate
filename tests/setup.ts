/**
 * Global test setup
 * Runs before all tests
 *
 * Note: Environment variables are set in vitest.env.ts (loaded first)
 */

import { afterAll, beforeAll, beforeEach } from "vitest";
import prisma from "../prisma";
import { emailQueue, connection as redis } from "../src/lib/queue";
import "./helpers/mock-email";

// Global test timeout
const TEST_TIMEOUT = 30000;

beforeAll(async () => {
	console.log("🧪 Starting test suite...");

	// Ensure we're using test database
	const dbUrl = process.env.DATABASE_URL;
	if (!dbUrl?.includes("test")) {
		throw new Error(
			"⚠️  DATABASE_URL must contain 'test' to run tests safely!\n" +
				"Example: postgresql://user:pass@localhost:5432/myapp_test",
		);
	}

	// Clean up database before tests
	await cleanDatabase();

	console.log("✅ Test environment ready");
}, TEST_TIMEOUT);

afterAll(async () => {
	console.log("🧹 Cleaning up test environment...");

	// Clean database after all tests
	await cleanDatabase();

	// Close connections
	await prisma.$disconnect();

	// Gracefully disconnect Redis
	try {
		await redis.quit();
		console.log("✅ Redis disconnected");
	} catch (error) {
		// Ignore if already closed
		console.warn("⚠️  Redis already closed", error);
	}

	console.log("✅ Cleanup complete");
}, TEST_TIMEOUT);

// Clean database before each test to ensure isolation
beforeEach(async () => {
	await cleanDatabase();
});

/**
 * Clean all tables in the database
 */
async function cleanDatabase() {
	// Delete in correct order to respect foreign keys
	await prisma.passwordReset.deleteMany();
	await prisma.session.deleteMany();
	await prisma.account.deleteMany();
	await prisma.casbinRule.deleteMany();
	await prisma.user.deleteMany();

	// Clean BullMQ email queue (obliterate removes all jobs, completed, failed, etc)
	try {
		await emailQueue.obliterate({ force: true });
	} catch (error) {
		console.warn("⚠️  Failed to clean email queue:", error);
	}

	// Clean ALL Redis keys (rate limit, cache, etc)
	const keys = await redis.keys("*");
	if (keys.length > 0) {
		await redis.del(...keys);
	}
}
