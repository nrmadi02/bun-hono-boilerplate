/**
 * Test App Factory
 * Creates app instance for testing
 */

import app from "../../src/app";

export type TestApp = typeof app;

/**
 * Get test app instance
 */
export function getTestApp(): TestApp {
	return app;
}

/**
 * Helper to make authenticated requests
 */
export function createAuthHeader(token: string) {
	return {
		Authorization: `Bearer ${token}`,
	};
}

/**
 * Helper to make JSON requests
 */
export function createJsonHeaders(additionalHeaders?: Record<string, string>) {
	return {
		"Content-Type": "application/json",
		...additionalHeaders,
	};
}
