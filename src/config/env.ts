import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
	NODE_ENV: z
		.enum(["development", "test", "production"])
		.default("development"),
	PORT: z.coerce.number().default(3000),
	JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
	REDIS_HOST: z.string().min(1, "REDIS_HOST is required"),
	REDIS_PORT: z.string().min(1, "REDIS_PORT is required"),
	RESEND_API_KEY: z.string().min(1, "RESEND_API_KEY is required"),
	BASE_URL: z.string().min(1, "BASE_URL is required"),
	USE_REDIS_CACHE: z.string().optional().default("false").transform((val) => val === "true"),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
	console.error(
		"❌ Invalid environment variables",
		z.treeifyError(parsed.error).properties,
	);
	throw new Error("Invalid .env configuration");
}

export const env = parsed.data;
