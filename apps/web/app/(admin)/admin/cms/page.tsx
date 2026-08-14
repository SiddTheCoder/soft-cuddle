/** CMS index — one card per content kind, with live draft/published counts. */
import { CONTENT_KINDS, listContent, type ContentKindSlug } from '@/lib/cms';
import { KindCard } from '@/components/admin/kind-card';

export const dynamic = 'force-dynamic';

export default async function CmsIndexPage() {
  const slugs = Object.keys(CONTENT_KINDS) as ContentKindSlug[];

  const cards = await Promise.all(
    slugs.map(async (slug) => {
      const rows = await listContent(slug);
      return {
        kind: CONTENT_KINDS[slug],
        total: rows.length,
        published: rows.filter((row) => row.status === 'published').length,
      };
    }),
  );

  return (
    <div className="max-w-4xl">
      <h1 className="headline text-2xl">Content</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Everything on the public site. Drafts are invisible until published.
      </p>

      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {cards.map(({ kind, total, published }) => (
          <li key={kind.slug}>
            <KindCard kind={kind} total={total} published={published} />
          </li>
        ))}
      </ul>
    </div>
  );
}
