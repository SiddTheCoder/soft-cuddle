/**
 * The core primitive. Every journal entry in the system is written here and
 * nowhere else.
 *
 * What this function does NOT do is as important as what it does: it does not
 * decide what to post. Posting rules live in `rules/`, each mapped to a
 * numbered section of docs/CHART_OF_ACCOUNTS.md §9. If a scenario has no rule
 * file, there is no rule — ask (docs/RULES.md §1).
 *
 * The balance check here is a fast, friendly failure. The authority is the
 * deferred constraint trigger in the database, which runs at COMMIT and cannot
 * be bypassed by application code (docs/DATABASE.md §2.1).
 */
import {
  journalEntries,
  ledgerEntries,
  type DbTx,
  type JournalEntry,
} from '@softmato/db';

import { AccountingError } from './errors';
import { allocateDocumentNo } from './numbering';
import { resolveFiscalPeriod } from './periods/resolve';

export interface JournalLineInput {
  accountCode: string;
  direction: 'debit' | 'credit';
  /** Paisa, always positive. Direction carries the sign. */
  amountMinor: bigint;
  currency?: string;
  /** Reporting dimension — what makes per-product P&L possible. */
  productId?: string;
  customerId?: number;
  memo?: string;
}

export interface PostJournalInput {
  source: JournalEntry['source'];
  /** Free-form pointer back to the originating record. */
  sourceTable?: string;
  sourceId?: string;
  description: string;
  /** Economic date. Decides the fiscal period, not `now()`. */
  occurredAt: Date;
  postedBy?: number;
  reversesJournalId?: number;
  lines: JournalLineInput[];
}

export interface PostedJournal {
  journalId: number;
  journalNo: string;
  fiscalPeriodId: number;
  fiscalYear: string;
}

/**
 * Must be called inside a transaction. The caller owns the transaction so that
 * the journal and whatever it records — a transaction row, an invoice status —
 * commit or roll back together.
 */
export async function postJournal(
  tx: DbTx,
  input: PostJournalInput,
): Promise<PostedJournal> {
  if (input.lines.length === 0) {
    throw new AccountingError(
      'EMPTY_JOURNAL',
      'A journal entry needs at least two lines',
      { description: input.description },
    );
  }

  assertBalanced(input);

  const period = await resolveFiscalPeriod(tx, input.occurredAt);

  // The database rejects postings into a closed period too; failing here gives
  // the caller a typed error instead of a raw trigger exception.
  if (
    (period.status === 'closed' || period.status === 'locked') &&
    input.source !== 'period_close'
  ) {
    throw new AccountingError(
      'PERIOD_NOT_OPEN',
      `Fiscal period ${period.fiscalYear}/${period.periodNo} is ${period.status}; cannot post`,
      { fiscalPeriodId: period.id, status: period.status },
    );
  }

  const { documentNo: journalNo } = await allocateDocumentNo(
    tx,
    'JE',
    period.fiscalYear,
  );

  const [journal] = await tx
    .insert(journalEntries)
    .values({
      journalNo,
      fiscalPeriodId: period.id,
      source: input.source,
      sourceTable: input.sourceTable ?? null,
      sourceId: input.sourceId ?? null,
      description: input.description,
      occurredAt: input.occurredAt,
      postedBy: input.postedBy ?? null,
      reversesJournalId: input.reversesJournalId ?? null,
    })
    .returning();

  if (!journal) {
    throw new AccountingError(
      'EMPTY_JOURNAL',
      'Journal insert returned no row',
      { journalNo },
    );
  }

  await tx.insert(ledgerEntries).values(
    input.lines.map((line, i) => ({
      journalId: journal.id,
      lineNo: i + 1,
      accountCode: line.accountCode,
      direction: line.direction,
      amountMinor: line.amountMinor,
      currency: line.currency ?? 'NPR',
      productId: line.productId ?? null,
      customerId: line.customerId ?? null,
      memo: line.memo ?? null,
    })),
  );

  return {
    journalId: journal.id,
    journalNo: journal.journalNo,
    fiscalPeriodId: period.id,
    fiscalYear: period.fiscalYear,
  };
}

/** Debits minus credits must be zero for every currency in the journal. */
function assertBalanced(input: PostJournalInput): void {
  const byCurrency = new Map<string, bigint>();

  for (const line of input.lines) {
    if (line.amountMinor <= 0n) {
      throw new AccountingError(
        'INVALID_AMOUNT',
        'Ledger amounts are always positive; direction carries the sign',
        { accountCode: line.accountCode, amountMinor: line.amountMinor.toString() },
      );
    }

    const currency = line.currency ?? 'NPR';
    const signed =
      line.direction === 'debit' ? line.amountMinor : -line.amountMinor;
    byCurrency.set(currency, (byCurrency.get(currency) ?? 0n) + signed);
  }

  for (const [currency, difference] of byCurrency) {
    if (difference !== 0n) {
      throw new AccountingError(
        'UNBALANCED_JOURNAL',
        `Journal is unbalanced in ${currency}: debits minus credits = ${difference} paisa`,
        { currency, differenceMinor: difference.toString() },
      );
    }
  }
}
