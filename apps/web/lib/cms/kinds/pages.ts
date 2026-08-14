import { z } from 'zod';

import {
  optionalText,
  requiredText,
  SEO_FIELDS,
  seoSchema,
  slugSchema,
} from '../fields';
import type { ContentKind } from '../types';

export const pagesKind: ContentKind = {
  slug: 'pages',
  label: 'Pages',
  singular: 'page',
  description:
    'Copy for pages that already exist in the site. Creating a row here does not create a route.',
  canCreate: false,
  createNote:
    'Pages match routes in the code, so they are not created from the admin panel. Edit the ones listed.',
  fields: [
    { name: 'slug', label: 'Slug', kind: 'text', required: true },
    { name: 'title', label: 'Title', kind: 'text', required: true },
    { name: 'body', label: 'Body', kind: 'markdown' },
    { name: 'ogImageUrl', label: 'Social image', kind: 'image' },
    ...SEO_FIELDS,
  ],
  schema: z.object({
    slug: slugSchema,
    title: requiredText,
    body: z.string(),
    ogImageUrl: optionalText,
    ...seoSchema,
  }),
  listColumns: [
    { field: 'title', label: 'Title' },
    { field: 'slug', label: 'Slug' },
  ],
};
