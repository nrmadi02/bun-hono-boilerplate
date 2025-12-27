import type { Job } from "bullmq";
import { sendEmailVerificationJob } from "./jobs/send-email-verification.job";
import { sendResetPasswordEmailJob } from "./jobs/send-reset-password-email.job";

export const EMAIL_TASK = {
	SendVerificationEmail: "send_verification_email",
	SendResetPasswordEmail: "send_reset_password_email",
} as const;

export type EmailTaskName = (typeof EMAIL_TASK)[keyof typeof EMAIL_TASK];

export const emailWorkerProcessor = async (job: Job) => {
	switch (job.name as EmailTaskName) {
		case EMAIL_TASK.SendVerificationEmail:
			return await sendEmailVerificationJob(job.data.emails, job.data.token);
		case EMAIL_TASK.SendResetPasswordEmail:
			return await sendResetPasswordEmailJob(job.data.emails, job.data.token);
		default:
			console.warn("[email] Unknown task", job.name, job.data);
	}
};
