import { z } from 'zod';

import { requiredText, slugSchema } from '../fields';
import type { ContentKind } from '../types';

/**
 * Versioned rather than overwritten: what a customer agreed to on a given date
 * has to stay knowable, so a new version is a new row and the old one keeps
 * its effective date.
 */
export const legalKind: ContentKind = {
  slug: 'legal',
  label: 'Legal documents',
  singular: 'legal document',
  description:
    'Versioned. Publishing a new version supersedes the previous one, which is kept so past agreements stay knowable.',
  canCreate: true,
  /** The database refuses to publish a policy with no effective date. */
  publishRequires: 'effectiveAt',
  fields: [
    { name: 'slug', label: 'Slug', kind: 'text', required: true },
    {
      name: 'version',
      label: 'Version',
      kind: 'number',
      required: true,
      hint: 'Increment rather than editing a published version.',
    },
    { name: 'title', label: 'Title', kind: 'text', required: true },
    { name: 'body', label: 'Body', kind: 'markdown' },
  ],
  schema: z.object({
    slug: slugSchema,
    version: z.coerce.number().int().positive(),
    title: requiredText,
    body: z.string(),
  }),
  listColumns: [
    { field: 'title', label: 'Document' },
    { field: 'slug', label: 'Slug' },
    { field: 'version', label: 'Version' },
  ],
};
