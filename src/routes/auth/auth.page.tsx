/** @jsxImportSource hono/jsx */
import { renderToString } from "hono/jsx/dom/server";
import { createRouter } from "../../lib/create-app";
import * as emailVerificationService from "../../services/auth/email-verification.service";
import { ResetPasswordView } from "../../views/auth/reset-password.view";
import { VerifyEmailView } from "../../views/auth/verify-email.view";

const router = createRouter()
	.get("/auth/verify-email", async (c) => {
		try {
			const token = c.req.query("token");

			if (!token) {
				return c.html(
					renderToString(
						<VerifyEmailView
							success={false}
							message="Token tidak ditemukan. Silakan periksa link verifikasi email Anda."
						/>,
					),
				);
			}

			const result = await emailVerificationService.verifyEmail(token);

			if (result.error) {
				switch (result.error) {
					case "INVALID_TOKEN":
						return c.html(
							renderToString(
								<VerifyEmailView
									success={false}
									message="Token tidak valid. Silakan minta email verifikasi baru."
								/>,
							),
						);
					case "TOKEN_ALREADY_USED":
						return c.html(
							renderToString(
								<VerifyEmailView
									success={false}
									message="Token sudah pernah digunakan atau sudah tidak valid. Silakan minta email verifikasi baru."
								/>,
							),
						);
					case "TOKEN_EXPIRED":
						return c.html(
							renderToString(
								<VerifyEmailView
									success={false}
									message="Token sudah kedaluwarsa. Silakan minta email verifikasi baru."
								/>,
							),
						);
					case "USER_NOT_FOUND":
						return c.html(
							renderToString(
								<VerifyEmailView
									success={false}
									message="User tidak ditemukan."
								/>,
							),
						);
					case "EMAIL_ALREADY_VERIFIED":
						return c.html(
							renderToString(
								<VerifyEmailView
									success={true}
									message="Email Anda sudah terverifikasi sebelumnya."
								/>,
							),
						);
					default:
						return c.html(
							renderToString(
								<VerifyEmailView
									success={false}
									message="Terjadi kesalahan saat memverifikasi email. Silakan coba lagi nanti."
								/>,
							),
						);
				}
			}

			return c.html(
				renderToString(
					<VerifyEmailView
						success={true}
						message="Email berhasil diverifikasi! Anda sekarang dapat menggunakan semua fitur aplikasi."
					/>,
				),
			);
		} catch {
			return c.html(
				renderToString(
					<VerifyEmailView
						success={false}
						message="Terjadi kesalahan saat memverifikasi email. Silakan coba lagi nanti."
					/>,
				),
			);
		}
	})
	.get("/auth/reset-password", async (c) => {
		const isSuccess = c.req.query("success");
		const message = c.req.query("message");
		const token = c.req.query("token");
		const error = c.req.query("error");

		return c.html(
			renderToString(
				<ResetPasswordView
					success={!!isSuccess}
					token={token}
					error={error}
					message={message}
				/>,
			),
		);
	});

export default router;
