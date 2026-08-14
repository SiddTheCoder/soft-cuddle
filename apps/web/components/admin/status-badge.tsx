/**
 * Draft/published badge.
 *
 * Deliberately not `--credit`: that colour means money in (docs/DESIGN.md §2),
 * and reusing it for a publication state would erode the one signal that has
 * to stay unambiguous on a ledger screen.
 */
export function StatusBadge({ status }: { status: 'draft' | 'published' }) {
  const published = status === 'published';

  return (
    <span
      className={`inline-block rounded-sm px-1.5 py-0.5 text-xs ${
        published
          ? 'bg-primary/10 text-primary'
          : 'bg-muted text-muted-foreground'
      }`}
    >
      {published ? 'Published' : 'Draft'}
    </span>
  );
}
