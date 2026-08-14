import { z } from 'zod';

import {
  optionalText,
  requiredText,
  SEO_FIELDS,
  seoSchema,
  slugSchema,
  SORT_ORDER_FIELD,
  sortOrderSchema,
} from '../fields';
import type { ContentKind } from '../types';

export const servicesKind: ContentKind = {
  slug: 'services',
  label: 'Services',
  singular: 'service',
  description: 'What the company takes on, shown on the services page.',
  canCreate: true,
  fields: [
    { name: 'slug', label: 'Slug', kind: 'text', required: true },
    { name: 'title', label: 'Title', kind: 'text', required: true },
    { name: 'summary', label: 'Summary', kind: 'textarea' },
    { name: 'body', label: 'Body', kind: 'markdown' },
    {
      name: 'icon',
      label: 'Icon',
      kind: 'text',
      hint: 'Icon name from the design system, not a URL.',
    },
    SORT_ORDER_FIELD,
    ...SEO_FIELDS,
  ],
  schema: z.object({
    slug: slugSchema,
    title: requiredText,
    summary: optionalText,
    body: z.string(),
    icon: optionalText,
    sortOrder: sortOrderSchema,
    ...seoSchema,
  }),
  listColumns: [
    { field: 'title', label: 'Title' },
    { field: 'slug', label: 'Slug' },
    { field: 'sortOrder', label: 'Order' },
  ],
};
