/**
 * Content kind schemas.
 *
 * These guard the form layer. The database has its own constraints and
 * packages/db/tests/cms.test.ts proves those — this file proves the founder
 * gets a useful message instead of a constraint violation, and that the two
 * layers agree about what a valid slug is.
 */
import { describe, expect, test } from 'vitest';

import { CONTENT_KINDS } from '@/lib/cms/registry';

const legal = CONTENT_KINDS.legal.schema;
const blog = CONTENT_KINDS.blog.schema;
const team = CONTENT_KINDS.team.schema;

describe('slug validation matches the database check constraint', () => {
  test.each([
    ['lowercase', 'refunds'],
    ['hyphenated', 'refund-and-cancellation'],
    ['with digits', 'policy-2026'],
  ])('accepts %s', (_label, slug) => {
    const result = legal.safeParse({
      slug,
      version: '1',
      title: 'Title',
      body: '',
    });
    expect(result.success).toBe(true);
  });

  test.each([
    ['uppercase', 'Refunds'],
    ['spaces', 'refund policy'],
    ['trailing hyphen', 'refunds-'],
    ['double hyphen', 'refund--policy'],
    ['a slash', 'legal/refunds'],
    ['empty', ''],
  ])('rejects %s', (_label, slug) => {
    const result = legal.safeParse({
      slug,
      version: '1',
      title: 'Title',
      body: '',
    });
    expect(result.success).toBe(false);
  });

  test('the message says what a valid slug looks like', () => {
    const result = legal.safeParse({
      slug: 'Bad Slug',
      version: '1',
      title: 'Title',
      body: '',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toMatch(/lowercase/i);
    }
  });
});

describe('empty optional fields become null, not empty strings', () => {
  test('a blank excerpt is null', () => {
    const result = blog.safeParse({
      slug: 'post',
      title: 'Post',
      excerpt: '',
      body: '',
      coverImageUrl: '',
      tags: '',
      metaTitle: '',
      metaDescription: '',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.excerpt).toBeNull();
      expect(result.data.coverImageUrl).toBeNull();
    }
  });
});

describe('tags', () => {
  const parse = (tags: string) =>
    blog.safeParse({
      slug: 'post',
      title: 'Post',
      excerpt: '',
      body: '',
      coverImageUrl: '',
      tags,
      metaTitle: '',
      metaDescription: '',
    });

  test('split on commas and trimmed', () => {
    const result = parse('nepal, payments ,accounting');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tags).toEqual(['nepal', 'payments', 'accounting']);
    }
  });

  test('an empty string is an empty array, never [""]', () => {
    const result = parse('');
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.tags).toEqual([]);
  });

  test('stray commas do not produce blank tags', () => {
    const result = parse('nepal,,payments,');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tags).toEqual(['nepal', 'payments']);
    }
  });
});

describe('required text', () => {
  test('whitespace alone does not satisfy a required field', () => {
    const result = team.safeParse({
      name: '   ',
      role: 'Founder',
      bio: '',
      photoUrl: '',
      email: '',
      linkedinUrl: '',
      githubUrl: '',
      sortOrder: '0',
    });

    expect(result.success).toBe(false);
  });

  test('sort order comes back as a number, not a string', () => {
    const result = team.safeParse({
      name: 'Someone',
      role: 'Founder',
      bio: '',
      photoUrl: '',
      email: '',
      linkedinUrl: '',
      githubUrl: '',
      sortOrder: '3',
    });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.sortOrder).toBe(3);
  });
});
