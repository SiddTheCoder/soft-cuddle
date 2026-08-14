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

/**
 * Marketing copy only. `productId` is not editable here — it points at the
 * ledger dimension, and moving it would move which product's books the page
 * claims to describe.
 */
export const productsKind: ContentKind = {
  slug: 'products',
  label: 'Product pages',
  singular: 'product page',
  description:
    'Marketing copy for a product. The product itself is a ledger dimension and is not created here.',
  canCreate: false,
  createNote:
    'A product page belongs to a product in the books. Products are seeded, not created from the CMS.',
  fields: [
    { name: 'slug', label: 'Slug', kind: 'text', required: true },
    { name: 'title', label: 'Display name', kind: 'text', required: true },
    { name: 'tagline', label: 'Tagline', kind: 'text' },
    { name: 'body', label: 'Body', kind: 'markdown' },
    { name: 'logoUrl', label: 'Logo', kind: 'image' },
    { name: 'screenshotUrl', label: 'Screenshot', kind: 'image' },
    { name: 'siteUrl', label: 'Product site URL', kind: 'text' },
    SORT_ORDER_FIELD,
    ...SEO_FIELDS,
  ],
  schema: z.object({
    slug: slugSchema,
    title: requiredText,
    tagline: optionalText,
    body: z.string(),
    logoUrl: optionalText,
    screenshotUrl: optionalText,
    siteUrl: optionalText,
    sortOrder: sortOrderSchema,
    ...seoSchema,
  }),
  listColumns: [
    { field: 'title', label: 'Product' },
    { field: 'productId', label: 'Ledger product' },
    { field: 'slug', label: 'Slug' },
  ],
};
