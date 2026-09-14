import 'dotenv/config';
import { z } from 'zod';

// Refuse to boot with the placeholder secrets from .env.example.
const secret = (name) =>
  z
    .string()
    .min(32, `${name} must be at least 32 characters`)
    .refine((v) => !/change-me/i.test(v), `${name} still uses the placeholder from .env.example`);

/**
 * Express trust proxy: "false" | "true" | hop count | comma-separated IPs.
 * Must match the real proxy chain, or client IPs and rate limits are wrong.
 */
const trustProxy = z
  .string()
  .trim()
  .optional()
  .transform((v) => {
    if (v === undefined || v === '') return undefined;
    if (v === 'true') return true;
    if (v === 'false') return false;
    if (/^\d+$/.test(v)) return Number(v);
    return v.split(',').map((s) => s.trim()).filter(Boolean);
  });

const envSchema = z
  .object({
    // Fail closed: a host that forgets NODE_ENV gets production behaviour, not debug output.
    NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),
    PORT: z.coerce.number().int().positive().default(5000),
    ADMIN_URL: z.string().default('http://localhost:5173'),
    APP_TIMEZONE: z.string().default('Asia/Kolkata'),
    TRUST_PROXY: trustProxy,

    MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),

    JWT_ACCESS_SECRET: secret('JWT_ACCESS_SECRET'),
    JWT_REFRESH_SECRET: secret('JWT_REFRESH_SECRET'),
    JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
    REFRESH_TOKEN_DAYS: z.coerce.number().int().positive().default(7),
    BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),
    COOKIE_SAMESITE: z.enum(['lax', 'strict', 'none']).default('strict'),

    CLOUDINARY_CLOUD_NAME: z.string().optional().default(''),
    CLOUDINARY_API_KEY: z.string().optional().default(''),
    CLOUDINARY_API_SECRET: z.string().optional().default(''),
    CLOUDINARY_FOLDER: z.string().default('bombay-engineers'),
  })
  .refine((e) => e.JWT_ACCESS_SECRET !== e.JWT_REFRESH_SECRET, {
    path: ['JWT_REFRESH_SECRET'],
    message: 'JWT_REFRESH_SECRET must differ from JWT_ACCESS_SECRET',
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // Logger depends on env, so fall back to console for boot-time failures.
  console.error('Invalid environment configuration:');
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

const raw = parsed.data;

export const env = Object.freeze({
  ...raw,
  isProduction: raw.NODE_ENV === 'production',
  isDevelopment: raw.NODE_ENV === 'development',
  // Default: one proxy in production, none elsewhere.
  trustProxy: raw.TRUST_PROXY ?? (raw.NODE_ENV === 'production' ? 1 : false),
  clientOrigins: raw.ADMIN_URL.split(',').map((o) => o.trim()).filter(Boolean),
  cloudinaryEnabled: Boolean(
    raw.CLOUDINARY_CLOUD_NAME && raw.CLOUDINARY_API_KEY && raw.CLOUDINARY_API_SECRET,
  ),
});
