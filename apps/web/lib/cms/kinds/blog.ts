import { z } from 'zod';

import {
  optionalText,
  requiredText,
  SEO_FIELDS,
  seoSchema,
  slugSchema,
  tagsSchema,
} from '../fields';
import type { ContentKind } from '../types';

export const blogKind: ContentKind = {
  slug: 'blog',
  label: 'Blog posts',
  singular: 'post',
  description: 'Drafts are invisible on the site until published.',
  canCreate: true,
  /** The database refuses a published post with no date — see cms.ts. */
  publishRequires: 'publishedAt',
  fields: [
    { name: 'slug', label: 'Slug', kind: 'text', required: true },
    { name: 'title', label: 'Title', kind: 'text', required: true },
    {
      name: 'excerpt',
      label: 'Excerpt',
      kind: 'textarea',
      hint: 'Shown on the blog index and used as the social description.',
    },
    { name: 'body', label: 'Body', kind: 'markdown' },
    { name: 'coverImageUrl', label: 'Cover image URL', kind: 'text' },
    { name: 'tags', label: 'Tags', kind: 'tags', hint: 'Comma separated.' },
    ...SEO_FIELDS,
  ],
  schema: z.object({
    slug: slugSchema,
    title: requiredText,
    excerpt: optionalText,
    body: z.string(),
    coverImageUrl: optionalText,
    tags: tagsSchema,
    ...seoSchema,
  }),
  listColumns: [
    { field: 'title', label: 'Title' },
    { field: 'slug', label: 'Slug' },
  ],
};
