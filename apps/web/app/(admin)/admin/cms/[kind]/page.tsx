/** List view for one content kind. Composition only — see the components. */
import { notFound } from 'next/navigation';

import { contentKind, isContentKind, listContent } from '@/lib/cms';
import { Breadcrumbs } from '@/components/admin/breadcrumbs';
import { ContentTable } from '@/components/admin/content-table';

export const dynamic = 'force-dynamic';

export default async function ContentListPage({
  params,
}: PageProps<'/admin/cms/[kind]'>) {
  const { kind: kindSlug } = await params;

  if (!isContentKind(kindSlug)) notFound();

  const kind = contentKind(kindSlug);
  const rows = await listContent(kindSlug);

  return (
    <div className="max-w-5xl">
      <Breadcrumbs trail={[{ label: 'Content', href: '/admin/cms' }]}>
        {kind.label}
      </Breadcrumbs>

      <h1 className="headline mt-2 text-2xl">{kind.label}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{kind.description}</p>

      {!kind.canCreate && kind.createNote ? (
        <p className="mt-3 rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
          {kind.createNote}
        </p>
      ) : null}

      {rows.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">
          No {kind.label.toLowerCase()} yet. Run <code>pnpm db:seed</code> to
          load the placeholder content.
        </p>
      ) : (
        <ContentTable
          kindSlug={kind.slug}
          columns={kind.listColumns}
          rows={rows}
        />
      )}
    </div>
  );
}
