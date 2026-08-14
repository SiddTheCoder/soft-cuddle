/**
 * Emits the twelve BS month boundaries of a Nepali fiscal year as the literal
 * `BsMonthBoundary[]` that `seed/fiscal-periods.ts` holds.
 *
 * This script exists so the table in the seed is reproducible and auditable,
 * not so it can be computed at seed time. Periods stay SEEDED, not computed
 * (docs/MEMORY.md, decisions) — the generated dates are pasted into
 * `bsCalendar` and reviewed once, by eye, against a printed patro. A runtime
 * conversion would let a library upgrade silently move a period boundary and
 * refile revenue into the wrong month.
 *
 *   pnpm --filter @softmato/db gen:bs-calendar 2083/84
 *
 * Verify before pasting: twelve rows, each `endsOn` equal to the next
 * `startsOn`, month lengths between 29 and 32 days, total 365 or 366.
 */
import { createRequire } from 'node:module';
import type NepaliDateClass from 'nepali-date-converter';

// The package ships UMD with a `default` property; a plain ESM default import
// resolves to the namespace object, not the class.
const cjsRequire = createRequire(import.meta.url);
const loaded = cjsRequire('nepali-date-converter') as
  typeof NepaliDateClass | { default: typeof NepaliDateClass };
const NepaliDate: typeof NepaliDateClass =
  'default' in loaded ? loaded.default : loaded;

/** Library month indices. 0 = Baisakh … 11 = Chaitra. */
const MONTH_NAMES = [
  'Baisakh',
  'Jestha',
  'Ashadh',
  'Shrawan',
  'Bhadra',
  'Ashwin',
  'Kartik',
  'Mangsir',
  'Poush',
  'Magh',
  'Falgun',
  'Chaitra',
] as const;

const SHRAWAN = 3;
const ASHADH = 2;
const DAY_MS = 86_400_000;

/** AD calendar date of BS year/month day 1, as `YYYY-MM-DD`. */
function firstOf(bsYear: number, bsMonth: number): string {
  const d = new NepaliDate(bsYear, bsMonth, 1).toJsDate();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function main(): void {
  const fiscalYear = process.argv[2];
  const match = fiscalYear?.match(/^(\d{4})\/(\d{2})$/);

  if (!match) {
    console.error('usage: gen-bs-calendar <fiscalYear>   e.g. 2083/84');
    process.exit(1);
  }

  const startYear = Number(match[1]);
  // Shrawan..Chaitra of the opening year, then Baisakh..Ashadh of the next.
  const months: Array<[year: number, month: number]> = [];
  for (let m = SHRAWAN; m <= 11; m += 1) months.push([startYear, m]);
  for (let m = 0; m <= ASHADH; m += 1) months.push([startYear + 1, m]);

  const rows = months.map(([year, month], i) => {
    const [nextYear, nextMonth] =
      month === 11 ? [year + 1, 0] : [year, month + 1];
    return {
      periodNo: i + 1,
      name: MONTH_NAMES[month],
      bsYear: year,
      startsOn: firstOf(year, month),
      endsOn: firstOf(nextYear, nextMonth),
    };
  });

  let totalDays = 0;
  for (const [i, row] of rows.entries()) {
    const days = Math.round(
      (Date.parse(row.endsOn) - Date.parse(row.startsOn)) / DAY_MS,
    );
    totalDays += days;

    if (days < 29 || days > 32) {
      throw new Error(
        `${row.name} ${row.bsYear} is ${days} days — outside 29–32. ` +
          'The converter is wrong or out of its supported range.',
      );
    }
    const next = rows[i + 1];
    if (next && next.startsOn !== row.endsOn) {
      throw new Error(
        `Gap between ${row.name} and ${next.name}: ` +
          `${row.endsOn} vs ${next.startsOn}.`,
      );
    }
  }

  if (totalDays !== 365 && totalDays !== 366) {
    throw new Error(`Fiscal year ${fiscalYear} totals ${totalDays} days.`);
  }

  console.error(`// ${fiscalYear} — ${totalDays} days, boundaries contiguous`);
  console.log(`  '${fiscalYear}': [`);
  for (const row of rows) {
    console.log(
      `    { periodNo: ${String(row.periodNo).padStart(2)}, ` +
        `startsOn: '${row.startsOn}', endsOn: '${row.endsOn}' },` +
        ` // ${row.name} ${row.bsYear}`,
    );
  }
  console.log('  ],');
}

main();
