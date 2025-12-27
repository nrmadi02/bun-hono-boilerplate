/**
 * Environment setup for tests
 * Must be imported BEFORE any application code
 *
 * Copy values from your .env.test.local here for tests to work
 */

// Set test environment variables
process.env.NODE_ENV = "test";
process.env.PORT = "5001";
process.env.BASE_URL = "http://localhost:5001";
process.env.JWT_SECRET = "ahsbxzncewrjasdbyjwheb";
process.env.DATABASE_URL =
	"postgresql://postgres:ulalaa2202@localhost:5432/hono_bun_test?connection_limit=20&pool_timeout=20";
process.env.REDIS_HOST = "localhost";
process.env.REDIS_PORT = "6379";
process.env.RESEND_API_KEY = "re_VHH3LHTM_JEhT18wFmkxgkPehUDHPfZHi";
process.env.USE_REDIS_CACHE = "false"; // Always false for tests
