import Link from 'next/link';

import type { ContentRow, ListColumn } from '@/lib/cms';
import { StatusBadge } from '@/components/admin/status-badge';

/**
 * Banded list table (docs/DESIGN.md §4).
 *
 * The band is structural, never hover-only — it is there so the eye tracks a
 * row across the columns, which is the same reason a ledger uses it. A real
 * `<table>`, not divs: screen readers need the row/column relationship the
 * band communicates visually.
 */

/** Columns whose values are figures and must be set in tabular mono. */
const NUMERIC_FIELDS = new Set(['version', 'sortOrder']);

export function ContentTable({
  kindSlug,
  columns,
  rows,
}: {
  kindSlug: string;
  columns: readonly ListColumn[];
  rows: ContentRow[];
}) {
  return (
    <div className="mt-6 overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border">
            {columns.map((col) => (
              <th key={col.field} scope="col" className={headerClass}>
                {col.label}
              </th>
            ))}
            <th scope="col" className={headerClass}>
              Status
            </th>
            <th scope="col" className="px-3 py-2">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id} className={index % 2 === 1 ? 'bg-muted' : ''}>
              {columns.map((col) => (
                <td
                  key={col.field}
                  className={`px-3 py-2 ${NUMERIC_FIELDS.has(col.field) ? 'numeric' : ''}`}
                >
                  {display(row[col.field])}
                </td>
              ))}
              <td className="px-3 py-2">
                <StatusBadge status={row.status} />
              </td>
              <td className="px-3 py-2 text-right">
                <Link
                  href={`/admin/cms/${kindSlug}/${row.id}`}
                  className="text-primary hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  Edit
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const headerClass =
  'eyebrow px-3 py-2 text-left text-xs text-muted-foreground font-normal';

function display(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (Array.isArray(value)) return value.join(', ');
  return String(value);
}
