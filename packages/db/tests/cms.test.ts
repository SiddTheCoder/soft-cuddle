/**
 * CMS constraints, exercised against a real Postgres.
 *
 * Same principle as ledger.test.ts: these write to the tables directly rather
 * than through any admin action, so they prove the DATABASE rejects bad
 * content. A test that only proved a Zod schema rejects it would still pass
 * with the check constraints dropped.
 *
 * The stakes are lower here than on the ledger — nothing in this file guards
 * money. What it guards is a public route being unable to address a row, and a
 * published policy with no date on it.
 */
import { afterAll, describe, expect, test } from 'vitest';
import { eq, inArray } from 'drizzle-orm';

import { db } from '../client';
import { blogPosts, legalDocuments, pages, productPages } from '../schema/cms';

const unique = () => Math.random().toString(36).slice(2, 10);

/** Every slug this file creates, so the suite leaves no rows behind. */
const createdSlugs: string[] = [];

const slug = (prefix: string) => {
  const value = `${prefix}-${unique()}`;
  createdSlugs.push(value);
  return value;
};

afterAll(async () => {
  if (createdSlugs.length === 0) return;
  await db.delete(pages).where(inArray(pages.slug, createdSlugs));
  await db.delete(blogPosts).where(inArray(blogPosts.slug, createdSlugs));
  await db
    .delete(legalDocuments)
    .where(inArray(legalDocuments.slug, createdSlugs));
  await db.delete(productPages).where(inArray(productPages.slug, createdSlugs));
});

describe('slugs must be addressable by a public route', () => {
  test('a lowercase kebab-case slug is accepted', async () => {
    const value = slug('about-the-company');

    await db.insert(pages).values({ slug: value, title: 'About' });

    const [row] = await db.select().from(pages).where(eq(pages.slug, value));
    expect(row?.status).toBe('draft');
  });

  test.each([
    ['an uppercase slug', 'About-Us'],
    ['a slug with spaces', 'about us'],
    ['a slug with a trailing hyphen', 'about-'],
    ['a slug with a slash', 'legal/terms'],
    ['an empty slug', ''],
  ])('%s is rejected', async (_label, bad) => {
    await expect(
      db.insert(pages).values({ slug: bad, title: 'Bad' }),
    ).rejects.toThrow();
  });

  test('two pages cannot share a slug', async () => {
    const value = slug('duplicate');
    await db.insert(pages).values({ slug: value, title: 'First' });

    await expect(
      db.insert(pages).values({ slug: value, title: 'Second' }),
    ).rejects.toThrow();
  });
});

describe('published content carries the date it needs', () => {
  test('a published blog post without publishedAt is rejected', async () => {
    await expect(
      db.insert(blogPosts).values({
        slug: slug('no-date'),
        title: 'Undated',
        status: 'published',
      }),
    ).rejects.toThrow();
  });

  test('a draft blog post without publishedAt is fine', async () => {
    const value = slug('draft-post');

    await db.insert(blogPosts).values({ slug: value, title: 'Draft' });

    const [row] = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.slug, value));
    expect(row?.publishedAt).toBeNull();
  });

  test('a published legal document without effectiveAt is rejected', async () => {
    await expect(
      db.insert(legalDocuments).values({
        slug: slug('refunds'),
        title: 'Refund Policy',
        status: 'published',
        publishedAt: new Date(),
      }),
    ).rejects.toThrow();
  });
});

describe('legal documents are versioned, not overwritten', () => {
  test('the same slug can hold several versions', async () => {
    const value = slug('terms');
    const effectiveAt = new Date('2026-08-01T00:00:00Z');

    await db.insert(legalDocuments).values([
      {
        slug: value,
        version: 1,
        title: 'Terms',
        status: 'published',
        effectiveAt,
      },
      { slug: value, version: 2, title: 'Terms', status: 'draft' },
    ]);

    const rows = await db
      .select()
      .from(legalDocuments)
      .where(eq(legalDocuments.slug, value));
    expect(rows).toHaveLength(2);
  });

  test('the same version of the same slug cannot exist twice', async () => {
    const value = slug('privacy');
    await db.insert(legalDocuments).values({ slug: value, title: 'Privacy' });

    await expect(
      db
        .insert(legalDocuments)
        .values({ slug: value, version: 1, title: 'Privacy again' }),
    ).rejects.toThrow();
  });
});

describe('marketing content cannot invent a ledger product', () => {
  test('a product page for an unknown product is rejected', async () => {
    await expect(
      db.insert(productPages).values({
        productId: `ghost-${unique()}`,
        slug: slug('ghost'),
        title: 'A product the books have never heard of',
      }),
    ).rejects.toThrow();
  });
});
