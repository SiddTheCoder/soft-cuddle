/**
 * Seed runner. Idempotent: safe to run repeatedly against a fresh or
 * partially-seeded database.
 *
 * Reference data only — accounts, products, providers, fiscal periods. It never
 * posts a journal entry.
 */
import { db } from '../client';
import { accounts, products } from '../schema/accounts';
import { fiscalPeriods } from '../schema/fiscal';
import { paymentProviders } from '../schema/providers';

import { accountSeeds } from './accounts';
import { productSeeds } from './products';
import { providerSeeds } from './providers';
import { buildFiscalPeriods } from './fiscal-periods';

// 2083/84 runs 17 Jul 2026 – 16 Jul 2027; it is the year in progress.
const FISCAL_YEAR = process.env.SEED_FISCAL_YEAR ?? '2083/84';

async function main(): Promise<void> {
  // Headers before leaves: parent_code is a foreign key onto accounts itself.
  const headers = accountSeeds.filter((a) => a.isPostable === false);
  const leaves = accountSeeds.filter((a) => a.isPostable !== false);

  for (const batch of [headers, leaves]) {
    for (const account of batch) {
      await db.insert(accounts).values(account).onConflictDoNothing();
    }
  }
  console.log(`accounts: ${accountSeeds.length} ensured`);

  await db.insert(products).values(productSeeds).onConflictDoNothing();
  console.log(`products: ${productSeeds.length} ensured`);

  await db.insert(paymentProviders).values(providerSeeds).onConflictDoNothing();
  console.log(`payment providers: ${providerSeeds.length} ensured`);

  // Throws with an explanation while the BS calendar is unconfirmed — that is
  // deliberate. Seeding invented period boundaries would misfile revenue.
  const periods = buildFiscalPeriods(FISCAL_YEAR);
  await db.insert(fiscalPeriods).values(periods).onConflictDoNothing();
  console.log(`fiscal periods: ${periods.length} ensured for ${FISCAL_YEAR}`);
}

await main();
console.log('seed complete');
process.exit(0);
