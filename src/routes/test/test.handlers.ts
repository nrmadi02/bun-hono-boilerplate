import type { AppRouteHandler } from "../../lib/types";
import { sendVerificationEmailAsync } from "../../tasks/email/clients/send-verification-email-async";
import type { TestRoute } from "./test.routes";

export const test: AppRouteHandler<TestRoute> = async (c) => {
	await sendVerificationEmailAsync(["nrmadi02@gmail.com"], "1234567890");
	return c.json({
		message: "Hello World",
		success: true,
		data: "Hello World",
	});
};
