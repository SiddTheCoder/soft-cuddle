/**
 * Migrations are a deliberate step, never an automatic one on deploy.
 * See docs/ENVIRONMENT.md §5.
 */
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

const pool = new Pool({ connectionString });

await migrate(drizzle(pool), { migrationsFolder: './migrations' });
await pool.end();

console.log('migrations applied');
