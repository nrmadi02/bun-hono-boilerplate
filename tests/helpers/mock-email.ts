/**
 * Email mocking utilities for tests
 *
 * This ensures email jobs are not actually processed during tests
 */

import { vi } from "vitest";

// Mock email sending functions
vi.mock("../../src/tasks/email/clients/send-email-async", () => ({
	sendVerificationEmailAsync: vi.fn().mockResolvedValue(undefined),
	sendResetPasswordEmailAsync: vi.fn().mockResolvedValue(undefined),
}));

// Mock email job processors (in case they're imported)
vi.mock("../../src/tasks/email/jobs/send-email-verification.job", () => ({
	sendEmailVerificationJob: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock("../../src/tasks/email/jobs/send-reset-password-email.job", () => ({
	sendResetPasswordEmailJob: vi.fn().mockResolvedValue({ success: true }),
}));

export const getMockedEmailFunctions = () => {
	const { sendVerificationEmailAsync, sendResetPasswordEmailAsync } =
		require("../../src/tasks/email/clients/send-email-async");

	return {
		sendVerificationEmailAsync,
		sendResetPasswordEmailAsync,
	};
};

export const clearEmailMocks = () => {
	const mocks = getMockedEmailFunctions();
	mocks.sendVerificationEmailAsync.mockClear();
	mocks.sendResetPasswordEmailAsync.mockClear();
};
