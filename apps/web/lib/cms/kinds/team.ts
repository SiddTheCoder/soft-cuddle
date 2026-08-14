import { z } from 'zod';

import {
  optionalText,
  requiredText,
  SORT_ORDER_FIELD,
  sortOrderSchema,
} from '../fields';
import type { ContentKind } from '../types';

export const teamKind: ContentKind = {
  slug: 'team',
  label: 'Team members',
  singular: 'team member',
  description:
    'Published members appear on the team page, ordered by sort order.',
  canCreate: true,
  fields: [
    { name: 'name', label: 'Name', kind: 'text', required: true },
    { name: 'role', label: 'Role', kind: 'text', required: true },
    { name: 'bio', label: 'Bio', kind: 'textarea' },
    { name: 'photoUrl', label: 'Photo', kind: 'image' },
    { name: 'email', label: 'Email', kind: 'text' },
    { name: 'linkedinUrl', label: 'LinkedIn URL', kind: 'text' },
    { name: 'githubUrl', label: 'GitHub URL', kind: 'text' },
    SORT_ORDER_FIELD,
  ],
  schema: z.object({
    name: requiredText,
    role: requiredText,
    bio: optionalText,
    photoUrl: optionalText,
    email: optionalText,
    linkedinUrl: optionalText,
    githubUrl: optionalText,
    sortOrder: sortOrderSchema,
  }),
  listColumns: [
    { field: 'name', label: 'Name' },
    { field: 'role', label: 'Role' },
    { field: 'sortOrder', label: 'Order' },
  ],
};
