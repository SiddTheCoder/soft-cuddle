/**
 * schema.sql SECTION 10 — subscriptions.
 *
 * Nepali wallets have no server-initiated auto-debit. The engine generates
 * renewal invoices and reminders; the customer initiates each payment.
 */
import { sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
  char,
  check,
  index,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core';

import { products } from './accounts';
import { applications } from './applications';
import { customers } from './customers';
import { paymentProviders } from './providers';

export const subscriptionStatus = pgEnum('subscription_status', [
  'trialing',
  'active',
  'past_due',
  'grace',
  'suspended',
  'cancelled',
  'expired',
]);

export const subscriptions = pgTable(
  'subscriptions',
  {
    id: bigint('id', { mode: 'number' })
      .generatedAlwaysAsIdentity()
      .primaryKey(),
    productId: text('product_id')
      .notNull()
      .references(() => products.id),
    applicationId: bigint('application_id', { mode: 'number' }).references(
      () => applications.id,
    ),
    customerId: bigint('customer_id', { mode: 'number' })
      .notNull()
      .references(() => customers.id),
    externalRef: text('external_ref'),
    planCode: text('plan_code').notNull(),
    amountMinor: bigint('amount_minor', { mode: 'bigint' }).notNull(),
    currency: char('currency', { length: 3 }).notNull().default('NPR'),
    intervalMonths: smallint('interval_months').notNull().default(1),
    status: subscriptionStatus('status').notNull().default('active'),
    currentPeriodStart: timestamp('current_period_start', {
      withTimezone: true,
    }).notNull(),
    currentPeriodEnd: timestamp('current_period_end', {
      withTimezone: true,
    }).notNull(),
    graceDays: smallint('grace_days').notNull().default(7),
    cancelAtPeriodEnd: boolean('cancel_at_period_end').notNull().default(false),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    unique('subscriptions_application_external_key').on(
      t.applicationId,
      t.externalRef,
    ),
    index('subs_renewal_idx')
      .on(t.currentPeriodEnd)
      .where(sql`${t.status} IN ('active','past_due','grace')`),
    check(
      'sub_period_valid',
      sql`${t.currentPeriodEnd} > ${t.currentPeriodStart}`,
    ),
    check('sub_interval_valid', sql`${t.intervalMonths} BETWEEN 1 AND 36`),
  ],
);

/**
 * Reserved for a future card rail. Unused today, but the shape is here so
 * enabling auto-debit later is a flag, not a migration.
 */
export const paymentMandates = pgTable('payment_mandates', {
  id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
  customerId: bigint('customer_id', { mode: 'number' })
    .notNull()
    .references(() => customers.id),
  providerId: text('provider_id')
    .notNull()
    .references(() => paymentProviders.id),
  providerToken: text('provider_token').notNull(),
  displayHint: text('display_hint'), // '**** 4242'
  isActive: boolean('is_active').notNull().default(true),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Subscription = typeof subscriptions.$inferSelect;
