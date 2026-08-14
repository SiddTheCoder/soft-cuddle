/**
 * schema.sql SECTION 13 — reporting views.
 *
 * Declared as existing views: the SQL lives in the hand-written migration so
 * Drizzle Kit never regenerates or drops it. `.existing()` gives typed reads
 * without letting the generator own the definition.
 */
import { bigint, char, pgView, smallint, text } from 'drizzle-orm/pg-core';

import { accountClass } from './accounts';

export const vTrialBalance = pgView('v_trial_balance', {
  code: text('code'),
  name: text('name'),
  class: accountClass('class'),
  fiscalYear: text('fiscal_year'),
  debitMinor: bigint('debit_minor', { mode: 'bigint' }),
  creditMinor: bigint('credit_minor', { mode: 'bigint' }),
  balanceMinor: bigint('balance_minor', { mode: 'bigint' }),
}).existing();

export const vProductPl = pgView('v_product_pl', {
  productId: text('product_id'),
  fiscalYear: text('fiscal_year'),
  periodNo: smallint('period_no'),
  class: accountClass('class'),
  code: text('code'),
  name: text('name'),
  amountMinor: bigint('amount_minor', { mode: 'bigint' }),
}).existing();

/** Sanity check: this must always return zero rows. */
export const vUnbalancedJournals = pgView('v_unbalanced_journals', {
  journalId: bigint('journal_id', { mode: 'number' }),
  currency: char('currency', { length: 3 }),
  differenceMinor: bigint('difference_minor', { mode: 'bigint' }),
}).existing();
