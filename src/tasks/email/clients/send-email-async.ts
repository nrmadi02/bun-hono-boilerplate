import { emailQueue } from "../../../lib/queue";
import { EMAIL_TASK } from "../processor";

export const sendVerificationEmailAsync = async (
	emails: string[],
	token: string,
) => {
	await emailQueue.add(EMAIL_TASK.SendVerificationEmail, { emails, token });
};

export const sendResetPasswordEmailAsync = async (
	emails: string[],
	token: string,
) => {
	await emailQueue.add(EMAIL_TASK.SendResetPasswordEmail, { emails, token });
};
