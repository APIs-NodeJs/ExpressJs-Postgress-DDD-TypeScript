import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).pipe(z.number().min(1).max(65535)).default('3000'),

  DB_HOST: z.string().min(1),
  DB_PORT: z.string().transform(Number).pipe(z.number().min(1).max(65535)).default('5432'),
  DB_NAME: z.string().min(1),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().min(1),

  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z.string().transform(Number).optional(),
  REDIS_PASSWORD: z.string().optional(),

  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),

  ALLOWED_ORIGINS: z.string().default('http://localhost:3000'),
});

export type EnvConfig = z.infer<typeof envSchema>;

function validateEnv(): EnvConfig {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('❌ Invalid environment variables:');
    console.error(JSON.stringify(parsed.error.format(), null, 2));
    process.exit(1);
  }

  return parsed.data;
}

export const config = validateEnv();
