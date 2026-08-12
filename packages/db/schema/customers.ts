/** schema.sql SECTION 4 — customers. */
import { sql } from 'drizzle-orm';
import {
  bigint,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core';

import { products } from './accounts';

export const customers = pgTable(
  'customers',
  {
    id: bigint('id', { mode: 'number' })
      .generatedAlwaysAsIdentity()
      .primaryKey(),
    productId: text('product_id')
      .notNull()
      .references(() => products.id),
    /** The SaaS's own customer id. */
    externalRef: text('external_ref'),
    name: text('name').notNull(),
    email: text('email'),
    phone: text('phone'),
    /** Customer's PAN, for TDS. */
    pan: text('pan'),
    address: text('address'),
    metadata: jsonb('metadata')
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    unique('customers_product_external_key').on(t.productId, t.externalRef),
    index('customers_email_idx').on(sql`lower(${t.email})`),
  ],
);

export type Customer = typeof customers.$inferSelect;
