/**
 * The registry: content kind slug → its definition and its table.
 *
 * Adding a content kind is two edits — a file in ./kinds and a line in each
 * map here. Nothing in the admin routes changes.
 */
import {
  blogPosts,
  legalDocuments,
  pages,
  productPages,
  services,
  teamMembers,
} from '@softmato/db';

import { blogKind } from './kinds/blog';
import { legalKind } from './kinds/legal';
import { pagesKind } from './kinds/pages';
import { productsKind } from './kinds/products';
import { servicesKind } from './kinds/services';
import { teamKind } from './kinds/team';
import type { ContentKind } from './types';

export const CONTENT_KINDS = {
  pages: pagesKind,
  blog: blogKind,
  team: teamKind,
  services: servicesKind,
  products: productsKind,
  legal: legalKind,
} satisfies Record<string, ContentKind>;

export type ContentKindSlug = keyof typeof CONTENT_KINDS;

/** Kept beside the registry so a kind can never point at the wrong table. */
export const CONTENT_TABLES = {
  pages,
  blog: blogPosts,
  team: teamMembers,
  services,
  products: productPages,
  legal: legalDocuments,
} satisfies Record<ContentKindSlug, unknown>;

export function isContentKind(value: string): value is ContentKindSlug {
  return Object.hasOwn(CONTENT_KINDS, value);
}

export function contentKind(slug: ContentKindSlug): ContentKind {
  return CONTENT_KINDS[slug];
}

export function tableFor(slug: ContentKindSlug) {
  return CONTENT_TABLES[slug];
}
