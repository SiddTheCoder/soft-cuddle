/**
 * schema.sql SECTION 3 — API clients (the SaaS products calling the payment API).
 *
 * `secret_hash` is argon2id. The plaintext secret is shown once, at issue, and
 * never stored. docs/API.md §2.
 */
import { sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
  check,
  index,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

import { products } from './accounts';

export const APPLICATION_SCOPES = [
  'payment:create',
  'payment:read',
  'invoice:create',
  'invoice:read',
  'refund:request',
  'customer:read',
] as const;

export type ApplicationScope = (typeof APPLICATION_SCOPES)[number];

export const applications = pgTable(
  'applications',
  {
    id: bigint('id', { mode: 'number' })
      .generatedAlwaysAsIdentity()
      .primaryKey(),
    productId: text('product_id')
      .notNull()
      .references(() => products.id),
    name: text('name').notNull(),
    clientId: text('client_id').notNull().unique(), // 'app_live_hostelhub_…'
    /** argon2id. Never the secret. */
    secretHash: text('secret_hash').notNull(),
    secretLast4: text('secret_last4').notNull(),
    scopes: text('scopes')
      .array()
      .$type<ApplicationScope[]>()
      .notNull()
      .default(sql`'{}'`),
    webhookUrl: text('webhook_url'),
    /** Signs outbound events. Never reaches a client bundle. */
    webhookSecret: text('webhook_secret'),
    isLive: boolean('is_live').notNull().default(false),
    isActive: boolean('is_active').notNull().default(true),
    rotatedAt: timestamp('rotated_at', { withTimezone: true }),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index('applications_product_idx').on(t.productId),
    check(
      'scopes_known',
      sql`${t.scopes} <@ ARRAY['payment:create','payment:read','invoice:create','invoice:read','refund:request','customer:read']::TEXT[]`,
    ),
  ],
);

export type Application = typeof applications.$inferSelect;
