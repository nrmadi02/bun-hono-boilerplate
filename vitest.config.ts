import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		environment: "node",
		env: {
			NODE_ENV: "test",
			PORT: "5001",
			BASE_URL: "http://localhost:5001",
			JWT_SECRET: "ahsbxzncewrjasdbyjwheb",
			DATABASE_URL:
				"postgresql://postgres:ulalaa2202@localhost:5432/hono_bun_test?connection_limit=20&pool_timeout=20",
			REDIS_HOST: "localhost",
			REDIS_PORT: "6379",
			RESEND_API_KEY: "re_VHH3LHTM_JEhT18wFmkxgkPehUDHPfZHi",
			USE_REDIS_CACHE: "false",
		},
		setupFiles: ["./tests/setup.ts"],
		include: ["tests/**/*.test.ts"],
		exclude: ["node_modules", "dist"],
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html"],
			exclude: [
				"node_modules/",
				"tests/",
				"**/*.test.ts",
				"**/*.config.ts",
				"dist/",
				"prisma/generated/",
			],
		},
		// Run tests sequentially to avoid DB conflicts
		pool: "forks",
		// Force sequential execution
		sequence: {
			concurrent: false,
		},
		maxConcurrency: 1,
		fileParallelism: false,
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
			"@tests": path.resolve(__dirname, "./tests"),
		},
	},
});
