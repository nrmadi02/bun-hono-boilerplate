import z from "zod";

const passwordSchema = z
	.string()
	.min(1, { message: "Password is required" })
	.min(8, { message: "Password must be at least 8 characters long" });
const emailSchema = z
	.email({ message: "Invalid email address" })
	.min(1, { message: "Email is required" });

export const loginSchema = z.object({
	email: emailSchema,
	password: passwordSchema,
});

export const registerSchema = z.object({
	email: emailSchema,
	password: passwordSchema,
	username: z
		.string()
		.min(1, { message: "Username is required" })
		.min(3, { message: "Username must be at least 3 characters long" }),
	fullName: z
		.string()
		.min(1, { message: "Full name is required" })
		.min(3, { message: "Full name must be at least 3 characters long" }),
});

export const forgotPasswordSchema = z.object({
	email: emailSchema,
});

export const resetPasswordSchema = z
	.object({
		token: z.string(),
		password: passwordSchema,
		confirmPassword: passwordSchema,
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	});

export const resendEmailVerificationSchema = z.object({
	email: emailSchema,
});

export const verifyEmailSchema = z.object({
	token: z.string().min(1, { message: "Token is required" }),
});
