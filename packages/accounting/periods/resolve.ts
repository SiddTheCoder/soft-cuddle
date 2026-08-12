/**
 * occurredAt → fiscal period.
 *
 * Resolution is by range lookup against the seeded `fiscal_periods` rows, never
 * computed from Gregorian months: BS boundaries do not align and BS month
 * lengths vary (docs/DATABASE.md §5).
 */
import { and, gt, lte } from 'drizzle-orm';
import { fiscalPeriods, type DbTx, type FiscalPeriod } from '@softmato/db';

import { AccountingError } from '../errors';

/**
 * `startsAt` is inclusive, `endsAt` exclusive — matching how the periods are
 * seeded. An instant on a boundary belongs to the later period, so no event can
 * land in two periods or in none.
 */
export async function resolveFiscalPeriod(
  tx: DbTx,
  occurredAt: Date,
): Promise<FiscalPeriod> {
  const [period] = await tx
    .select()
    .from(fiscalPeriods)
    .where(
      and(
        lte(fiscalPeriods.startsAt, occurredAt),
        gt(fiscalPeriods.endsAt, occurredAt),
      ),
    )
    .limit(1);

  if (!period) {
    throw new AccountingError(
      'NO_FISCAL_PERIOD',
      `No fiscal period covers ${occurredAt.toISOString()}. Seed the BS year before posting.`,
      { occurredAt: occurredAt.toISOString() },
    );
  }

  return period;
}
