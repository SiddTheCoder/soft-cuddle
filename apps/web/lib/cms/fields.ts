/**
 * Field and schema fragments shared across content kinds.
 *
 * Defined once so a rule cannot drift between two kinds — particularly the
 * slug rule, which must stay identical to the check constraint in
 * packages/db/schema/cms.ts.
 */
import { z } from 'zod';

import type { FieldSpec } from './types';

/** Mirrors the `*_slug_format` check constraint. Keep the two in step. */
export const slugSchema = z
  .string()
  .min(1, 'Required')
  .regex(
    /^[a-z0-9]+(-[a-z0-9]+)*$/,
    'Lowercase letters, numbers and single hyphens only',
  );

/** An empty input means "not set", not an empty string. */
export const optionalText = z
  .string()
  .trim()
  .transform((v) => (v === '' ? null : v))
  .nullable();

export const requiredText = z.string().trim().min(1, 'Required');

export const sortOrderSchema = z.coerce.number().int();

/** Comma separated in the form, an array in the database. */
export const tagsSchema = z
  .string()
  .transform((v) =>
    v
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean),
  )
  .pipe(z.array(z.string()));

export const SEO_FIELDS: FieldSpec[] = [
  {
    name: 'metaTitle',
    label: 'Meta title',
    kind: 'text',
    hint: 'Overrides the title in search results. Blank uses the title above.',
  },
  {
    name: 'metaDescription',
    label: 'Meta description',
    kind: 'textarea',
    hint: 'One or two sentences, shown under the link in search results.',
  },
];

export const seoSchema = {
  metaTitle: optionalText,
  metaDescription: optionalText,
};

export const SORT_ORDER_FIELD: FieldSpec = {
  name: 'sortOrder',
  label: 'Sort order',
  kind: 'number',
  hint: 'Ascending. Lower numbers appear first.',
};
