/**
 * Gapless sequences: `JE-2082/83-000001`, `INV-…`, `TXN-…`.
 *
 * Gapless matters for audit — a missing number looks like a deleted entry. A
 * Postgres sequence cannot deliver this: sequences skip on rollback by design.
 *
 * So allocation is serialised with a transaction-scoped advisory lock keyed on
 * (kind, fiscal year), and the next number is read from the rows themselves.
 * The lock is released at COMMIT or ROLLBACK, so a rolled-back transaction
 * leaves no hole. Allocation must therefore happen inside the same transaction
 * as the insert (docs/DATABASE.md §3).
 */
import { sql } from 'drizzle-orm';
import type { DbTx } from '@softmato/db';

export type SequenceKind = 'JE' | 'INV' | 'TXN';

const WIDTH: Record<SequenceKind, number> = {
  JE: 6,
  INV: 6,
  TXN: 8,
};

const TABLE: Record<SequenceKind, string> = {
  JE: 'journal_entries',
  INV: 'invoices',
  TXN: 'transactions',
};

const COLUMN: Record<SequenceKind, string> = {
  JE: 'journal_no',
  INV: 'invoice_no',
  TXN: 'txn_no',
};

export function formatDocumentNo(
  kind: SequenceKind,
  fiscalYear: string,
  sequence: number,
): string {
  return `${kind}-${fiscalYear}-${String(sequence).padStart(WIDTH[kind], '0')}`;
}

/**
 * Returns the next sequence number for the kind within the fiscal year.
 * Call inside the transaction that inserts the row — never before it.
 */
export async function allocateSequence(
  tx: DbTx,
  kind: SequenceKind,
  fiscalYear: string,
): Promise<number> {
  const lockKey = `${kind}:${fiscalYear}`;
  await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`);

  const prefix = `${kind}-${fiscalYear}-`;
  const table = sql.identifier(TABLE[kind]);
  const column = sql.identifier(COLUMN[kind]);

  const result = await tx.execute<{ max_sequence: string | null }>(sql`
    SELECT MAX(SUBSTRING(${column} FROM ${prefix.length + 1})::BIGINT) AS max_sequence
    FROM ${table}
    WHERE ${column} LIKE ${prefix + '%'}
  `);

  const row = result.rows[0];
  const current = row?.max_sequence ? Number(row.max_sequence) : 0;
  return current + 1;
}

export async function allocateDocumentNo(
  tx: DbTx,
  kind: SequenceKind,
  fiscalYear: string,
): Promise<{ sequence: number; documentNo: string }> {
  const sequence = await allocateSequence(tx, kind, fiscalYear);
  return { sequence, documentNo: formatDocumentNo(kind, fiscalYear, sequence) };
}
