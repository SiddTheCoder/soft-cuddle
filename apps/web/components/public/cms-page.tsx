import { notFound } from 'next/navigation';

import { getPage } from '@/lib/cms/public-queries';
import { Markdown } from '@/components/public/markdown';
import { PageHeader } from '@/components/public/page-header';

/**
 * A whole page driven by one `pages` row.
 *
 * Used by home, about, careers and the section index pages. An unpublished
 * page 404s rather than rendering empty — a blank page with a nav bar looks
 * broken, and 404 is the honest answer.
 */
export async function CmsPage({
  slug,
  children,
}: {
  slug: string;
  /** Rendered under the body, for pages with more than copy on them. */
  children?: React.ReactNode;
}) {
  const page = await getPage(slug);

  if (!page) notFound();

  return (
    <article>
      <PageHeader title={page.title} />
      {page.body ? <Markdown>{page.body}</Markdown> : null}
      {children}
    </article>
  );
}
