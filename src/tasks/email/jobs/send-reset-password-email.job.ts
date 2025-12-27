import { resendEmail } from "../../../lib/resend";
import { ResetPasswordTemplate } from "../templates/reset-password.template";

export const sendResetPasswordEmailJob = async (
	emails: string[],
	token: string,
) => {
	try {
		console.log("[email] Sending reset password email", emails);

		const response = await resendEmail(
			emails,
			"Reset Password",
			ResetPasswordTemplate({ token }),
		);
		if (response.error) {
			throw new Error(response.error.message);
		}
		console.info(
			"[email] Reset password email sent successfully",
			response.data,
		);
	} catch (error) {
		console.error("[email] Error sending reset password email", error);
		throw error;
	}
};
