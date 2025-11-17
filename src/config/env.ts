import "dotenv/config";
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    console.error('❌ Invalid environment variables', z.treeifyError(parsed.error).properties);
    throw new Error('Invalid .env configuration');
}

export const env = parsed.data;