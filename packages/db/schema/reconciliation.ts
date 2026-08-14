/**
 * schema.sql SECTION 11 — reconciliation.
 *
 * A mismatch is never auto-resolved. It is flagged and a human resolves it
 * (docs/RULES.md §2.8).
 */
import { bigint, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

import { paymentProviders } from './providers';
import { transactions } from './payments';

export const reconStatus = pgEnum('recon_status', [
  'open',
  'matched',
  'mismatched',
  'resolved',
]);

export const reconciliationRuns = pgTable('reconciliation_runs', {
  id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
  providerId: text('provider_id')
    .notNull()
    .references(() => paymentProviders.id),
  periodStart: timestamp('period_start', { withTimezone: true }).notNull(),
  periodEnd: timestamp('period_end', { withTimezone: true }).notNull(),
  internalTotalMinor: bigint('internal_total_minor', {
    mode: 'bigint',
  }).notNull(),
  providerTotalMinor: bigint('provider_total_minor', { mode: 'bigint' }),
  bankTotalMinor: bigint('bank_total_minor', { mode: 'bigint' }),
  differenceMinor: bigint('difference_minor', { mode: 'bigint' }),
  status: reconStatus('status').notNull().default('open'),
  notes: text('notes'),
  runBy: bigint('run_by', { mode: 'number' }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
});

export const reconciliationItems = pgTable('reconciliation_items', {
  id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
  runId: bigint('run_id', { mode: 'number' })
    .notNull()
    .references(() => reconciliationRuns.id),
  transactionId: bigint('transaction_id', { mode: 'number' }).references(
    () => transactions.id,
  ),
  providerRef: text('provider_ref'),
  internalMinor: bigint('internal_minor', { mode: 'bigint' }),
  providerMinor: bigint('provider_minor', { mode: 'bigint' }),
  status: reconStatus('status').notNull().default('open'),
  note: text('note'),
});

export type ReconciliationRun = typeof reconciliationRuns.$inferSelect;
export type ReconciliationItem = typeof reconciliationItems.$inferSelect;
