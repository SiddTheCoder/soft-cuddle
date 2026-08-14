/**
 * Admin dashboard.
 *
 * Shows the one number that must always be zero. If `v_unbalanced_journals`
 * ever returns a row, the books are wrong and nothing else on this page
 * matters (docs/TESTING.md §2).
 */
import { sql } from 'drizzle-orm';
import { db } from '@softmato/db';

export const dynamic = 'force-dynamic';

async function unbalancedJournalCount(): Promise<number> {
  const result = await db.execute<{ count: string }>(
    sql`SELECT count(*)::text AS count FROM v_unbalanced_journals`,
  );
  return Number(result.rows[0]?.count ?? '0');
}

export default async function AdminDashboard() {
  const unbalanced = await unbalancedJournalCount();
  const healthy = unbalanced === 0;

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>

      <section
        className={`mt-6 max-w-md rounded border p-4 ${
          healthy
            ? 'border-neutral-200 bg-neutral-50'
            : 'border-red-300 bg-red-50'
        }`}
      >
        <h2 className="text-sm font-medium text-neutral-700">
          Ledger integrity
        </h2>
        <p className="mt-1 text-sm text-neutral-600">
          {healthy ? (
            <>Every journal balances.</>
          ) : (
            <strong className="text-red-700">
              {unbalanced} unbalanced journal
              {unbalanced === 1 ? '' : 's'}. Investigate before posting anything
              further.
            </strong>
          )}
        </p>
      </section>

      <p className="mt-6 text-sm text-neutral-500">
        Payments, invoicing, and accounting views arrive in Phases 3, 6, and 7.
      </p>
    </div>
  );
}
