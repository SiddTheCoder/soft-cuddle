/**
 * Fiscal periods — Shrawan 1 to Ashad end, one row per BS month.
 *
 * Periods are SEEDED, never computed: BS month boundaries do not align with
 * Gregorian months and BS month lengths vary year to year (docs/MEMORY.md,
 * decisions). A computed calendar would silently misfile revenue.
 *
 * The table below is generated, never hand-typed:
 *
 *   pnpm --filter @softmato/db gen:bs-calendar 2084/85
 *
 * `scripts/gen-bs-calendar.ts` derives the boundaries from the published BS
 * calendar tables in `nepali-date-converter` and refuses to emit anything whose
 * months are not contiguous, 29–32 days each, and 365 or 366 days in total.
 * Paste its output here and check it once by eye against a patro. Do not call
 * the converter at seed time — a library upgrade must not be able to move a
 * period boundary under posted history.
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
 * Keyed by fiscal year, e.g. '2083/84'. Add the next year before Ashadh ends —
 * a journal dated past the last boundary has no period to resolve into and
 * `postJournal()` will refuse it.
 */
export const bsCalendar: Record<string, BsMonthBoundary[]> = {
  '2083/84': [
    { periodNo: 1, startsOn: '2026-07-17', endsOn: '2026-08-17' }, // Shrawan 2083
    { periodNo: 2, startsOn: '2026-08-17', endsOn: '2026-09-17' }, // Bhadra 2083
    { periodNo: 3, startsOn: '2026-09-17', endsOn: '2026-10-18' }, // Ashwin 2083
    { periodNo: 4, startsOn: '2026-10-18', endsOn: '2026-11-17' }, // Kartik 2083
    { periodNo: 5, startsOn: '2026-11-17', endsOn: '2026-12-16' }, // Mangsir 2083
    { periodNo: 6, startsOn: '2026-12-16', endsOn: '2027-01-15' }, // Poush 2083
    { periodNo: 7, startsOn: '2027-01-15', endsOn: '2027-02-13' }, // Magh 2083
    { periodNo: 8, startsOn: '2027-02-13', endsOn: '2027-03-15' }, // Falgun 2083
    { periodNo: 9, startsOn: '2027-03-15', endsOn: '2027-04-14' }, // Chaitra 2083
    { periodNo: 10, startsOn: '2027-04-14', endsOn: '2027-05-15' }, // Baisakh 2084
    { periodNo: 11, startsOn: '2027-05-15', endsOn: '2027-06-16' }, // Jestha 2084
    { periodNo: 12, startsOn: '2027-06-16', endsOn: '2027-07-17' }, // Ashadh 2084
  ],
};

export function buildFiscalPeriods(fiscalYear: string): FiscalPeriodSeed[] {
  const months = bsCalendar[fiscalYear];

  if (!months || months.length !== 12) {
    throw new Error(
      `No verified BS calendar for fiscal year ${fiscalYear}. ` +
        'Generate it with `pnpm --filter @softmato/db gen:bs-calendar ' +
        `${fiscalYear}\` and paste the twelve boundaries into bsCalendar in ` +
        'packages/db/seed/fiscal-periods.ts. Do not type these dates by hand.',
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
