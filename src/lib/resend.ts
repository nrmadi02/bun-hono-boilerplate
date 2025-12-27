import type { ReactNode } from "react";
import { Resend } from "resend";
import { env } from "../config/env";

const resend = new Resend(env.RESEND_API_KEY);

export const resendEmail = async (
	emails: string[],
	subject: string,
	react: ReactNode,
) => {
	const response = await resend.emails.send({
		from: "Hono Bun <honobun@bapendakalselprov.com>",
		to: emails,
		subject: subject,
		react: react,
	});
	return response;
};

export default resend;
