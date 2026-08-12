/**
 * Creates the first admin. Run once per environment:
 *
 *   pnpm admin:create -- --email you@example.com --name "Your Name"
 *
 * The password is read from ADMIN_PASSWORD in the environment, never from an
 * argument — arguments land in shell history and process listings.
 *
 * The user is inserted with TOTP already enrolled, because `admin_users`
 * cannot represent an active admin without it (docs/DATABASE.md §2.4). The
 * enrolment URI is printed once and never stored in plaintext.
 */
import { hash as argon2Hash } from '@node-rs/argon2';
import { eq } from 'drizzle-orm';

import { adminUsers, closeDb, db } from '@softmato/db';
import { createTotpEnrolment } from '../apps/web/lib/totp.core';

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? undefined : process.argv[index + 1];
}

const email = arg('email')?.toLowerCase();
const name = arg('name');
const password = process.env.ADMIN_PASSWORD;

if (!email || !name) {
  throw new Error('Usage: pnpm admin:create -- --email <email> --name <name>');
}

/**
 * 12 characters everywhere that matters. Local development may use something
 * shorter — a throwaway password on a throwaway database is a convenience, not
 * a risk — but the exception is scoped to APP_ENV=local so it cannot follow the
 * account into preview or production.
 */
const MIN_LENGTH = process.env.APP_ENV === 'local' ? 8 : 12;

if (!password || password.length < MIN_LENGTH) {
  throw new Error(
    `Set ADMIN_PASSWORD in the environment (${MIN_LENGTH} characters minimum). ` +
      'Do not pass it as a command-line argument.',
  );
}

if (password.length < 12) {
  console.warn(
    '\n⚠  Weak password accepted because APP_ENV=local.\n' +
      '   This account must not exist in preview or production.\n',
  );
}

const [existing] = await db
  .select({ id: adminUsers.id })
  .from(adminUsers)
  .where(eq(adminUsers.email, email))
  .limit(1);

if (existing) {
  throw new Error(`An admin with email ${email} already exists.`);
}

// OWASP-recommended argon2id parameters: 19 MiB, 2 iterations, 1 lane.
const passwordHash = await argon2Hash(password, {
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
});

const enrolment = createTotpEnrolment(email);

const [created] = await db
  .insert(adminUsers)
  .values({
    email,
    name,
    passwordHash,
    totpSecret: enrolment.encryptedSecret,
    totpEnabled: true,
    isActive: true,
    role: 'founder',
  })
  .returning({ id: adminUsers.id });

console.log(`\nAdmin created: ${email} (id ${created!.id})\n`);
console.log('Add this to your authenticator app now — it is shown once:\n');
console.log(`  ${enrolment.otpauthUri}\n`);
console.log(
  'Turn it into a QR code if your app cannot take a URI directly.\n' +
    'The secret is stored encrypted; it cannot be recovered from the database.\n',
);

await closeDb();
