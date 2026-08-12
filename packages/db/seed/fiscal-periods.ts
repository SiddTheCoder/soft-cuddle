/**
 * Fiscal periods — Shrawan 1 to Ashad end, one row per BS month.
 *
 * Periods are SEEDED, never computed: BS month boundaries do not align with
 * Gregorian months and BS month lengths vary year to year (docs/MEMORY.md,
 * decisions). A computed calendar would silently misfile revenue.
 *
 * BLOCKED — two founder answers are required before this can be filled in
 * (docs/MEMORY.md, blocked items 1–2):
 *   * the go-live date, which decides which BS year to seed;
 *   * the AD boundary dates for that year's twelve BS months, taken from an
 *     authoritative Nepali calendar, not from memory.
 *
 * Boundaries are Asia/Kathmandu midnight (UTC+05:45), stored as timestamptz.
 * `startsAt` is inclusive, `endsAt` is the exclusive start of the next month —
 * `assert_period_open()` and period resolution both rely on that convention.
 */
import type { fiscalPeriods } from '../schema/fiscal';

type FiscalPeriodSeed = typeof fiscalPeriods.$inferInsert;

/** Kathmandu-midnight ISO instant for an AD calendar date. */
const ktm = (isoDate: `${number}-${number}-${number}`): Date =>
  new Date(`${isoDate}T00:00:00+05:45`);

export interface BsMonthBoundary {
  /** 1 = Shrawan … 12 = Ashad. */
  periodNo: number;
  /** AD date of the first day of this BS month. */
  startsOn: `${number}-${number}-${number}`;
  /** AD date of the first day of the NEXT BS month (exclusive end). */
  endsOn: `${number}-${number}-${number}`;
}

/**
 * Keyed by fiscal year, e.g. '2082/83'.
 *
 * Intentionally empty. Fill in from a verified BS calendar once the founder
 * confirms the go-live year; `pnpm db:seed` fails loudly until then rather
 * than inventing dates.
 */
export const bsCalendar: Record<string, BsMonthBoundary[]> = {};

export function buildFiscalPeriods(fiscalYear: string): FiscalPeriodSeed[] {
  const months = bsCalendar[fiscalYear];

  if (!months || months.length !== 12) {
    throw new Error(
      `No verified BS calendar for fiscal year ${fiscalYear}. ` +
        'Add its twelve month boundaries to bsCalendar in ' +
        'packages/db/seed/fiscal-periods.ts. See docs/MEMORY.md (blocked on ' +
        'the founder: go-live date). Do not guess these dates.',
    );
  }

  return months.map((m) => ({
    fiscalYear,
    periodNo: m.periodNo,
    startsAt: ktm(m.startsOn),
    endsAt: ktm(m.endsOn),
    status: 'open' as const,
  }));
}
