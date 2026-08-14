/**
 * schema.sql SECTION 12 — users & audit.
 *
 * `totp_required` is enforced by the database: an active admin without TOTP
 * cannot exist. Never relax it (docs/RULES.md §3).
 * `audit_logs` is append-only, enforced by trigger — on Vercel there is no SSH,
 * so the audit log is the debugger.
 */
import { sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
  check,
  index,
  inet,
  jsonb,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const adminUsers = pgTable(
  'admin_users',
  {
    id: bigint('id', { mode: 'number' })
      .generatedAlwaysAsIdentity()
      .primaryKey(),
    email: text('email').notNull().unique(),
    name: text('name').notNull(),
    /** argon2id. */
    passwordHash: text('password_hash').notNull(),
    /** Encrypted at rest with ENCRYPTION_KEY (AES-256-GCM). */
    totpSecret: text('totp_secret'),
    totpEnabled: boolean('totp_enabled').notNull().default(false),
    role: text('role').notNull().default('founder'),
    isActive: boolean('is_active').notNull().default(true),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [check('totp_required', sql`NOT ${t.isActive} OR ${t.totpEnabled}`)],
);

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: bigint('id', { mode: 'number' })
      .generatedAlwaysAsIdentity()
      .primaryKey(),
    actorType: text('actor_type').notNull(), // 'admin','application','system'
    actorId: text('actor_id'),
    action: text('action').notNull(), // 'refund.approve'
    resourceType: text('resource_type').notNull(),
    resourceId: text('resource_id'),
    beforeState: jsonb('before_state').$type<Record<string, unknown>>(),
    afterState: jsonb('after_state').$type<Record<string, unknown>>(),
    ipAddress: inet('ip_address'),
    userAgent: text('user_agent'),
    requestId: text('request_id'),
    occurredAt: timestamp('occurred_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index('audit_resource_idx').on(t.resourceType, t.resourceId),
    index('audit_actor_idx').on(t.actorType, t.actorId),
    index('audit_time_idx').on(t.occurredAt.desc()),
  ],
);

export type AdminUser = typeof adminUsers.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
