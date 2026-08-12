/**
 * schema.sql SECTION 2 — the ledger.
 *
 * The guarantees that matter here are NOT expressible in Drizzle:
 *   1. a journal cannot commit unbalanced  (deferred constraint trigger)
 *   2. ledger rows cannot be updated or deleted  (BEFORE UPDATE/DELETE trigger)
 *   3. nothing posts into a closed period  (BEFORE INSERT trigger)
 *   4. only postable, active accounts accept a line
 *
 * They live in the hand-written migration `migrations/0001_ledger_guarantees.sql`
 * and must survive every regeneration. See docs/RULES.md §3.
 */
import { sql } from 'drizzle-orm';
import {
  bigint,
  char,
  check,
  index,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  unique,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core';

import { accounts, products } from './accounts';
import { fiscalPeriods } from './fiscal';

export const journalSource = pgEnum('journal_source', [
  'payment',
  'refund',
  'invoice',
  'revenue_recognition',
  'settlement',
  'expense',
  'payroll',
  'manual',
  'reversal',
  'opening_balance',
  'period_close',
]);

export const journalEntries = pgTable(
  'journal_entries',
  {
    id: bigint('id', { mode: 'number' })
      .generatedAlwaysAsIdentity()
      .primaryKey(),
    journalNo: text('journal_no').notNull(), // 'JE-2082/83-000001'
    fiscalPeriodId: bigint('fiscal_period_id', { mode: 'number' })
      .notNull()
      .references(() => fiscalPeriods.id),
    source: journalSource('source').notNull(),
    /** Free-form pointer back to the originating record. */
    sourceTable: text('source_table'),
    sourceId: text('source_id'),
    description: text('description').notNull(),
    /** Economic date — drives fiscal period resolution. */
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
    postedAt: timestamp('posted_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    postedBy: bigint('posted_by', { mode: 'number' }),
    reversesJournalId: bigint('reverses_journal_id', {
      mode: 'number',
    }).references((): AnyPgColumn => journalEntries.id),
    reversedByJournalId: bigint('reversed_by_journal_id', {
      mode: 'number',
    }).references((): AnyPgColumn => journalEntries.id),
  },
  (t) => [
    unique('journal_entries_journal_no_key').on(t.journalNo),
    index('journal_entries_period_idx').on(t.fiscalPeriodId),
    index('journal_entries_source_idx').on(t.sourceTable, t.sourceId),
    index('journal_entries_occurred_idx').on(t.occurredAt),
    check(
      'no_self_reversal',
      sql`${t.reversesJournalId} IS DISTINCT FROM ${t.id}`,
    ),
  ],
);

export const entryDirection = pgEnum('entry_direction', ['debit', 'credit']);

export const ledgerEntries = pgTable(
  'ledger_entries',
  {
    id: bigint('id', { mode: 'number' })
      .generatedAlwaysAsIdentity()
      .primaryKey(),
    journalId: bigint('journal_id', { mode: 'number' })
      .notNull()
      .references(() => journalEntries.id),
    lineNo: smallint('line_no').notNull(),
    accountCode: text('account_code')
      .notNull()
      .references(() => accounts.code),
    direction: entryDirection('direction').notNull(),
    /** Paisa. `bigint` in TypeScript, always. docs/RULES.md §2.1. */
    amountMinor: bigint('amount_minor', { mode: 'bigint' }).notNull(),
    currency: char('currency', { length: 3 }).notNull().default('NPR'),
    /** The dimension that makes product-level P&L possible. */
    productId: text('product_id').references(() => products.id),
    customerId: bigint('customer_id', { mode: 'number' }),
    memo: text('memo'),
  },
  (t) => [
    unique('ledger_entries_journal_line_key').on(t.journalId, t.lineNo),
    index('ledger_entries_journal_idx').on(t.journalId),
    index('ledger_entries_account_idx').on(t.accountCode),
    index('ledger_entries_product_idx').on(t.productId),
    check('amount_positive', sql`${t.amountMinor} > 0`),
    check('currency_iso', sql`${t.currency} ~ '^[A-Z]{3}$'`),
  ],
);

export type JournalEntry = typeof journalEntries.$inferSelect;
export type NewJournalEntry = typeof journalEntries.$inferInsert;
export type LedgerEntry = typeof ledgerEntries.$inferSelect;
export type NewLedgerEntry = typeof ledgerEntries.$inferInsert;
