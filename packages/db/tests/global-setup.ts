/**
 * Global teardown asserts `v_unbalanced_journals` returns zero rows, exactly as
 * docs/TESTING.md §2 requires. If a suite ever leaves the books unbalanced, the
 * run fails even when every individual test passed.
 */
import { sql } from 'drizzle-orm';

export async function setup(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      'DATABASE_URL is not set. Database tests never run against a mock.',
    );
  }
}

export async function teardown(): Promise<void> {
  const { db, closeDb } = await import('../client');

  try {
    const result = await db.execute<{ journal_id: string }>(
      sql`SELECT journal_id FROM v_unbalanced_journals`,
    );

    if (result.rows.length > 0) {
      throw new Error(
        `v_unbalanced_journals returned ${result.rows.length} row(s). The books do not balance: ` +
          result.rows.map((r) => r.journal_id).join(', '),
      );
    }
  } finally {
    await closeDb();
  }
}
