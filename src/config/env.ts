import { config } from "dotenv";
import { z } from "zod";

// Load environment variables
if (process.env.NODE_ENV !== "test") {
	config(); // Load .env for development/production
}

const envSchema = z.object({
	NODE_ENV: z
		.enum(["development", "test", "production"])
		.default("development"),
	PORT: z.coerce.number().default(3000),
	DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
	JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
	REDIS_HOST: z.string().min(1, "REDIS_HOST is required"),
	REDIS_PORT: z.string().min(1, "REDIS_PORT is required"),
	RESEND_API_KEY: z.string().min(1, "RESEND_API_KEY is required"),
	BASE_URL: z.string().min(1, "BASE_URL is required"),
	USE_REDIS_CACHE: z
		.string()
		.optional()
		.default("false")
		.transform((val) => val === "true"),
});

let env: z.infer<typeof envSchema>;

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
	// If in test mode and parsing failed, provide defaults
	if (process.env.NODE_ENV === "test") {
		console.warn(
			"⚠️  Test environment variables not fully configured, using defaults",
		);
		env = {
			NODE_ENV: "test" as const,
			PORT: 5001,
			DATABASE_URL:
				"postgresql://postgres:ulalaa2202@localhost:5432/hono_bun_test?connection_limit=20&pool_timeout=20",
			JWT_SECRET: "ahsbxzncewrjasdbyjwheb",
			REDIS_HOST: "localhost",
			REDIS_PORT: "6379",
			RESEND_API_KEY: "re_VHH3LHTM_JEhT18wFmkxgkPehUDHPfZHi",
			BASE_URL: "http://localhost:5001",
			USE_REDIS_CACHE: false,
		};

		// Set env vars for other modules
		process.env.DATABASE_URL = env.DATABASE_URL;
		process.env.JWT_SECRET = env.JWT_SECRET;
		process.env.REDIS_HOST = env.REDIS_HOST;
		process.env.REDIS_PORT = env.REDIS_PORT;
		process.env.RESEND_API_KEY = env.RESEND_API_KEY;
		process.env.BASE_URL = env.BASE_URL;
		process.env.USE_REDIS_CACHE = "false";
	} else {
		console.error(
			"❌ Invalid environment variables",
			z.treeifyError(parsed.error).properties,
		);
		throw new Error("Invalid .env configuration");
	}
} else {
	env = parsed.data;
}

export { env };
