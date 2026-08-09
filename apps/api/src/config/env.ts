import 'dotenv/config';
import { z } from 'zod';

const booleanFromString = z.preprocess(
  (value) => value === true || value === 'true',
  z.boolean(),
);

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  API_PUBLIC_URL: z.string().url().default('http://localhost:4000'),
  CORS_ORIGINS: z.string().default('http://localhost:8081,http://localhost:19006'),
  DATABASE_URL: z.string().min(1).default('postgresql://postgres:postgres@localhost:5432/student_rental'),
  JWT_SECRET: z.string().min(32).default('development-only-secret-change-me-123456'),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL: z.string().default('30d'),
  OTP_TTL_MINUTES: z.coerce.number().int().positive().max(30).default(10),
  OTP_PROVIDER: z.enum(['console', 'sms', 'email']).default('console'),
  DEMO_MODE: booleanFromString.default(true),
  UPLOAD_DRIVER: z.enum(['local', 's3', 'cloudinary']).default('local'),
  UPLOAD_DIR: z.string().default('uploads'),
  MAX_IMAGE_SIZE_MB: z.coerce.number().positive().max(20).default(8),
  AVAILABILITY_REMINDER_DAYS: z.coerce.number().int().positive().default(14),
  AVAILABILITY_STALE_DAYS: z.coerce.number().int().positive().default(30),
  EXACT_LOCATION_ADMIN_ONLY: booleanFromString.default(true),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  throw new Error(`Invalid environment configuration: ${parsed.error.message}`);
}

export const env = {
  ...parsed.data,
  corsOrigins: parsed.data.CORS_ORIGINS.split(',').map((value) => value.trim()).filter(Boolean),
};
