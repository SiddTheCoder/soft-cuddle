/**
 * Seed runner. Idempotent: safe to run repeatedly against a fresh or
 * partially-seeded database.
 *
 * Reference data only — accounts, products, providers, fiscal periods, and
 * placeholder CMS content. It never posts a journal entry, and it never
 * publishes a page.
 */
import { sql } from 'drizzle-orm';

import { db } from '../client';
import { accounts, products } from '../schema/accounts';
import {
  blogPosts,
  legalDocuments,
  pages,
  productPages,
  services,
  teamMembers,
} from '../schema/cms';
import { fiscalPeriods } from '../schema/fiscal';
import { paymentProviders } from '../schema/providers';

import { accountSeeds } from './accounts';
import {
  blogPostSeeds,
  legalDocumentSeeds,
  pageSeeds,
  productPageSeeds,
  serviceSeeds,
  teamMemberSeeds,
} from './cms';
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

  await seedCms();
}

/**
 * Placeholder content, all of it draft. See ./cms.ts — nothing here is
 * publishable copy, and the seeder never publishes anything.
 */
async function seedCms(): Promise<void> {
  await db.insert(pages).values(pageSeeds).onConflictDoNothing();
  await db.insert(services).values(serviceSeeds).onConflictDoNothing();
  await db.insert(productPages).values(productPageSeeds).onConflictDoNothing();
  await db
    .insert(legalDocuments)
    .values(legalDocumentSeeds)
    .onConflictDoNothing();
  await db.insert(blogPosts).values(blogPostSeeds).onConflictDoNothing();

  /*
   * team_members has no natural key to conflict on — a person is not
   * identified by their name. Insert only into an empty table, so a re-run
   * cannot duplicate the placeholders or resurrect ones the founder deleted.
   */
  const [existing] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(teamMembers);

  if ((existing?.count ?? 0) === 0) {
    await db.insert(teamMembers).values(teamMemberSeeds);
  }

  console.log(
    `cms: ${pageSeeds.length} pages, ${serviceSeeds.length} services, ` +
      `${productPageSeeds.length} product pages, ${legalDocumentSeeds.length} legal ` +
      `documents, ${blogPostSeeds.length} post — all draft`,
  );
}

await main();
console.log('seed complete');
process.exit(0);
