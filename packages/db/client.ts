/**
 * Driver switch: `pg` locally, Neon's HTTP/WebSocket driver in production.
 *
 * The two drivers do NOT behave identically around transactions — the HTTP
 * driver batches, the pool does not. Anything touching the ledger must be
 * exercised against a Neon branch before a phase is accepted (PHASES.md,
 * "Ongoing after each phase").
 */
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import {
  drizzle as drizzlePg,
  type NodePgDatabase,
} from 'drizzle-orm/node-postgres';
import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import { Pool as PgPool } from 'pg';
import ws from 'ws';

import * as schema from './schema/index';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

const isNeon = /neon\.tech/i.test(connectionString);

/**
 * Both drivers expose the same Drizzle query surface, so callers get one
 * concrete type. That is a typing convenience only — it does NOT mean the two
 * behave identically at runtime, which is why every phase is also exercised
 * against a Neon branch.
 */
let pool: NeonPool | PgPool;

function createDb(): NodePgDatabase<typeof schema> {
  if (isNeon) {
    // WebSocket pool, not the HTTP driver: real transactions are required for
    // postJournal(). See docs/DATABASE.md §2.1.
    neonConfig.webSocketConstructor = ws;
    pool = new NeonPool({ connectionString });
    return drizzleNeon(pool, {
      schema,
    }) as unknown as NodePgDatabase<typeof schema>;
  }
  pool = new PgPool({ connectionString });
  return drizzlePg(pool, { schema });
}

export const db = createDb();

/** For scripts and test teardown. Serverless request handlers must not call it. */
export async function closeDb(): Promise<void> {
  await pool.end();
}
export type Db = NodePgDatabase<typeof schema>;
/** A transaction handle — what every ledger write must be given. */
export type DbTx = Parameters<Parameters<Db['transaction']>[0]>[0];
export { schema };
