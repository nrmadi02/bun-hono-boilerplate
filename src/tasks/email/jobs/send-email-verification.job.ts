import { resendEmail } from "../../../lib/resend";
import { EmailVerificationTemplate } from "../templates/email-verification.template";

export const sendEmailVerificationJob = async (
	emails: string[],
	token: string,
) => {
	try {
		console.log("[email] Sending email verification", emails);

		const response = await resendEmail(
			emails,
			"Email Verification",
			EmailVerificationTemplate({ token }),
		);
		if (response.error) {
			throw new Error(response.error.message);
		}
		console.info("[email] Email verification sent successfully", response.data);
	} catch (error) {
		console.error("[email] Error sending email verification", error);
		throw error;
	}
};
