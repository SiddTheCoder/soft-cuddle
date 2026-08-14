import Link from 'next/link';

import type { ContentKind } from '@/lib/cms';

/** One content kind on the CMS index, with its draft/published counts. */
export function KindCard({
  kind,
  total,
  published,
}: {
  kind: ContentKind;
  total: number;
  published: number;
}) {
  return (
    <Link
      href={`/admin/cms/${kind.slug}`}
      className="section-frame block rounded-lg p-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      <span className="font-medium">{kind.label}</span>
      <span className="numeric ml-2 text-xs text-muted-foreground">
        {published}/{total} published
      </span>
      <p className="mt-1 text-sm text-muted-foreground">{kind.description}</p>
    </Link>
  );
}
