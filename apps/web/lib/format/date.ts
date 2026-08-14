import NepaliDate from 'nepali-date-converter';

/**
 * Date display. **BS primary, AD secondary** (docs/DESIGN.md §5).
 *
 * Conversion happens here, at render, never at write. Stored values stay UTC.
 * This is the opposite of the fiscal period rule in
 * packages/db/seed/fiscal-periods.ts, and deliberately so: a display string can
 * be recomputed if a library changes, a period boundary under posted history
 * cannot.
 */

const BS_MONTHS = [
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

/** `12 Bhadra 2082`. */
export function formatBs(date: Date): string {
  const bs = new NepaliDate(date);
  const month = BS_MONTHS[bs.getMonth()] ?? '';
  return `${bs.getDate()} ${month} ${bs.getYear()}`;
}

/** `28 Aug 2026`. */
export function formatAd(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kathmandu',
  }).format(date);
}

/** `12 Bhadra 2082 (28 Aug 2026)` — where precision matters. */
export function formatBsWithAd(date: Date): string {
  return `${formatBs(date)} (${formatAd(date)})`;
}

/** `2082/05/12` — dense tables, set in mono. */
export function formatBsNumeric(date: Date): string {
  const bs = new NepaliDate(date);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${bs.getYear()}/${pad(bs.getMonth() + 1)}/${pad(bs.getDate())}`;
}
