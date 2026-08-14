import 'server-only';
import { asc, desc, eq } from 'drizzle-orm';
import {
  blogPosts,
  db,
  legalDocuments,
  pages,
  productPages,
  services,
  teamMembers,
} from '@softmato/db';

import { tableFor, type ContentKindSlug } from './registry';
import type { ContentRow } from './types';

/**
 * Reads for the admin list and edit views. Admin-side only — these return
 * drafts, which the public site must never see. Public reads filter on
 * `status = 'published'` and live in ./public-queries.
 *
 * Ordering is per kind rather than generic: a blog index is newest-first, a
 * services list is in the order the founder chose, a legal list groups by
 * document with the newest version on top.
 */
export async function listContent(
  slug: ContentKindSlug,
): Promise<ContentRow[]> {
  switch (slug) {
    case 'blog':
      return (await db
        .select()
        .from(blogPosts)
        .orderBy(
          desc(blogPosts.publishedAt),
          desc(blogPosts.createdAt),
        )) as ContentRow[];

    case 'legal':
      return (await db
        .select()
        .from(legalDocuments)
        .orderBy(
          asc(legalDocuments.slug),
          desc(legalDocuments.version),
        )) as ContentRow[];

    case 'team':
      return (await db
        .select()
        .from(teamMembers)
        .orderBy(
          asc(teamMembers.sortOrder),
          asc(teamMembers.name),
        )) as ContentRow[];

    case 'services':
      return (await db
        .select()
        .from(services)
        .orderBy(asc(services.sortOrder), asc(services.title))) as ContentRow[];

    case 'products':
      return (await db
        .select()
        .from(productPages)
        .orderBy(
          asc(productPages.sortOrder),
          asc(productPages.title),
        )) as ContentRow[];

    case 'pages':
      return (await db
        .select()
        .from(pages)
        .orderBy(asc(pages.slug))) as ContentRow[];
  }
}

export async function getContent(
  slug: ContentKindSlug,
  id: number,
): Promise<ContentRow | null> {
  const table = tableFor(slug) as typeof pages;

  const rows = (await db
    .select()
    .from(table)
    .where(eq(table.id, id))
    .limit(1)) as unknown as ContentRow[];

  return rows[0] ?? null;
}
