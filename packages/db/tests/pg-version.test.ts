/**
 * Records which Postgres major the target database runs. Not a guard — an
 * observation the setup docs depend on: docs/ENVIRONMENT.md pins local Postgres
 * to "match Neon's major version".
 */
import { expect, test } from 'vitest';
import { sql } from 'drizzle-orm';

import { db } from '../client';

test('reports the server version', async () => {
  const result = await db.execute<{ sv: string }>(
    sql`SELECT current_setting('server_version') AS sv`,
  );
  const version = result.rows[0]!.sv;
  console.log(`Postgres server_version = ${version}`);
  expect(Number.parseInt(version, 10)).toBeGreaterThanOrEqual(16);
});
