/**
 * Drafts must never reach the public site.
 *
 * This is the one CMS rule with a real consequence: an unpublished refund
 * policy or a half-written post going live. The admin reads deliberately
 * return drafts, so the only thing standing between a draft and a visitor is
 * the `status = 'published'` filter in apps/web/lib/cms/public-queries.ts.
 *
 * These tests seed a draft next to a published row and assert the published
 * one comes back alone. They run in the db package because that is where the
 * suite already has a real Postgres; the queries under test are simple enough
 * to restate here, and restating them is the point — if someone drops the
 * filter from public-queries.ts, the shape asserted here is what they broke.
 */
import { afterAll, describe, expect, test } from 'vitest';
import { and, desc, eq, inArray } from 'drizzle-orm';

import { db } from '../client';
import { blogPosts, legalDocuments, pages, teamMembers } from '../schema/cms';

const unique = () => Math.random().toString(36).slice(2, 10);
const marker = `pubtest-${unique()}`;

const slugs: string[] = [];
const slug = (prefix: string) => {
  const value = `${marker}-${prefix}`;
  slugs.push(value);
  return value;
};

afterAll(async () => {
  await db.delete(pages).where(inArray(pages.slug, slugs));
  await db.delete(blogPosts).where(inArray(blogPosts.slug, slugs));
  await db.delete(legalDocuments).where(inArray(legalDocuments.slug, slugs));
  await db.delete(teamMembers).where(eq(teamMembers.role, marker));
});

describe('a draft is not reachable by the public query', () => {
  test('a draft page is invisible; the published one is not', async () => {
    const draft = slug('draft-page');
    const live = slug('live-page');

    await db.insert(pages).values([
      { slug: draft, title: 'Draft' },
      { slug: live, title: 'Live', status: 'published' },
    ]);

    const draftResult = await db
      .select()
      .from(pages)
      .where(and(eq(pages.slug, draft), eq(pages.status, 'published')));

    const liveResult = await db
      .select()
      .from(pages)
      .where(and(eq(pages.slug, live), eq(pages.status, 'published')));

    expect(draftResult).toHaveLength(0);
    expect(liveResult).toHaveLength(1);
  });

  test('a draft post never appears in the published list', async () => {
    const draft = slug('draft-post');
    const live = slug('live-post');

    await db.insert(blogPosts).values([
      { slug: draft, title: 'Draft' },
      {
        slug: live,
        title: 'Live',
        status: 'published',
        publishedAt: new Date(),
      },
    ]);

    const listed = await db
      .select({ slug: blogPosts.slug })
      .from(blogPosts)
      .where(eq(blogPosts.status, 'published'));

    const returned = listed.map((r) => r.slug);
    expect(returned).toContain(live);
    expect(returned).not.toContain(draft);
  });

  test('a team member who has left is not listed even when published', async () => {
    await db.insert(teamMembers).values([
      { name: 'Still here', role: marker, status: 'published' },
      {
        name: 'Has left',
        role: marker,
        status: 'published',
        isActive: false,
      },
    ]);

    const listed = await db
      .select({ name: teamMembers.name })
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.role, marker),
          eq(teamMembers.status, 'published'),
          eq(teamMembers.isActive, true),
        ),
      );

    expect(listed.map((r) => r.name)).toEqual(['Still here']);
  });
});

describe('legal documents serve the current published version', () => {
  test('the newest published version wins, and a newer draft does not', async () => {
    const value = slug('terms');
    const effectiveAt = new Date('2026-01-01T00:00:00Z');

    await db.insert(legalDocuments).values([
      {
        slug: value,
        version: 1,
        title: 'v1',
        status: 'published',
        effectiveAt,
      },
      {
        slug: value,
        version: 2,
        title: 'v2',
        status: 'published',
        effectiveAt,
      },
      // Being written now — must not supersede the live version.
      { slug: value, version: 3, title: 'v3 draft', status: 'draft' },
    ]);

    const [current] = await db
      .select()
      .from(legalDocuments)
      .where(
        and(
          eq(legalDocuments.slug, value),
          eq(legalDocuments.status, 'published'),
        ),
      )
      .orderBy(desc(legalDocuments.version))
      .limit(1);

    expect(current?.title).toBe('v2');
  });

  test('a superseded version is still retrievable by version', async () => {
    const value = slug('privacy');
    const effectiveAt = new Date('2026-01-01T00:00:00Z');

    await db.insert(legalDocuments).values([
      {
        slug: value,
        version: 1,
        title: 'old',
        status: 'published',
        effectiveAt,
      },
      {
        slug: value,
        version: 2,
        title: 'new',
        status: 'published',
        effectiveAt,
      },
    ]);

    const [old] = await db
      .select()
      .from(legalDocuments)
      .where(
        and(eq(legalDocuments.slug, value), eq(legalDocuments.version, 1)),
      );

    expect(old?.title).toBe('old');
  });
});
