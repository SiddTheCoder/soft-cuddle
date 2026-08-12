/**
 * Boot-time environment validation (docs/ENVIRONMENT.md §2).
 *
 * "A missing ENCRYPTION_KEY must fail at startup, not at the first login."
 *
 * Server-only. Importing this from a client component is a build error by
 * design — `server-only` makes the mistake impossible rather than merely
 * discouraged.
 */
import 'server-only';
import { z } from 'zod';

const hex32 = z
  .string()
  .regex(/^[0-9a-fA-F]{64}$/, 'must be 32 bytes of hex (64 characters)');

const serverSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_ENV: z.enum(['local', 'preview', 'production']).default('local'),

  DATABASE_URL: z.string().url(),

  AUTH_SECRET: z.string().min(32, 'generate with: openssl rand -base64 32'),
  AUTH_URL: z.string().url().optional(),
  CRON_SECRET: z.string().min(16),
  /** AES-256-GCM key for TOTP secrets at rest. */
  ENCRYPTION_KEY: hex32,

  PAYMENT_MODE: z.enum(['sandbox', 'live']).default('sandbox'),

  COMPANY_NAME: z.string().default('Softmato Technology Pvt Ltd'),
});

const publicSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_CHECKOUT_URL: z.string().url(),
});

function parse<T extends z.ZodTypeAny>(schema: T, source: unknown): z.infer<T> {
  const result = schema.safeParse(source);

  if (!result.success) {
    const detail = result.error.issues
      .map((i) => `  ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    // The variable NAMES are safe to print. The values never are.
    throw new Error(`Invalid environment configuration:\n${detail}`);
  }

  return result.data;
}

export const env = {
  ...parse(serverSchema, process.env),
  ...parse(publicSchema, {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_CHECKOUT_URL: process.env.NEXT_PUBLIC_CHECKOUT_URL,
  }),
};

/**
 * A preview deployment must never hold live provider credentials
 * (docs/ENVIRONMENT.md §4).
 */
if (env.APP_ENV === 'preview' && env.PAYMENT_MODE === 'live') {
  throw new Error(
    'PAYMENT_MODE=live is not permitted on a preview deployment. ' +
      'Every preview runs against provider sandboxes.',
  );
}
