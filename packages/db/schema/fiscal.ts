/**
 * schema.sql SECTION 1 — fiscal calendar (Shrawan–Ashad), seeded per BS year.
 *
 * Periods are seeded, never computed: BS month boundaries do not align with
 * Gregorian months and month lengths vary (docs/MEMORY.md, decisions).
 */
import { sql } from 'drizzle-orm';
import {
  bigint,
  check,
  index,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core';

export const periodStatus = pgEnum('period_status', [
  'open',
  'reconciliation_required',
  'closed',
  'locked',
]);

export const fiscalPeriods = pgTable(
  'fiscal_periods',
  {
    id: bigint('id', { mode: 'number' })
      .generatedAlwaysAsIdentity()
      .primaryKey(),
    fiscalYear: text('fiscal_year').notNull(), // '2082/83'
    periodNo: smallint('period_no').notNull(), // 1 = Shrawan … 12 = Ashad
    startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
    endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
    status: periodStatus('status').notNull().default('open'),
    closedAt: timestamp('closed_at', { withTimezone: true }),
    closedBy: bigint('closed_by', { mode: 'number' }),
  },
  (t) => [
    unique('fiscal_periods_year_no_key').on(t.fiscalYear, t.periodNo),
    index('fiscal_periods_range_idx').on(t.startsAt, t.endsAt),
    check('period_range_valid', sql`${t.endsAt} > ${t.startsAt}`),
    check('period_no_valid', sql`${t.periodNo} BETWEEN 1 AND 12`),
  ],
);

export type FiscalPeriod = typeof fiscalPeriods.$inferSelect;
