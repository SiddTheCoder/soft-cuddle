import 'server-only';

import { auth } from '@/lib/auth';
import { isContentKind, type ContentKindSlug } from '@/lib/cms';

export interface ActionResult {
  ok: boolean;
  message?: string;
  /** Field name → problem, for rendering next to the input. */
  fieldErrors?: Record<string, string>;
}

/**
 * Every action re-checks the session rather than trusting the layout.
 *
 * The layout guard decides what is *rendered*; a server action is a POST
 * endpoint and is reachable without it. `mfa` is checked explicitly for the
 * same reason it is in the layout — a session that never cleared TOTP must not
 * mutate anything (docs/TESTING.md §9).
 */
export async function requireAdmin(): Promise<string> {
  const session = await auth();

  if (!session?.user || session.user.mfa !== true) {
    throw new Error('Not authorised');
  }

  return session.user.id;
}

export function parseId(raw: FormDataEntryValue | null): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) throw new Error('Bad id');
  return id;
}

export function requireKind(raw: FormDataEntryValue | null): ContentKindSlug {
  const value = String(raw ?? '');
  if (!isContentKind(value)) throw new Error('Unknown content kind');
  return value;
}

/**
 * Turns a Postgres constraint violation into something a founder can act on.
 *
 * The database has the last word on slug format, uniqueness and the
 * published-needs-a-date rules. Zod mirrors them for a better message, but a
 * race, or a rule Zod does not know about, surfaces here rather than as a 500.
 */
export function databaseMessage(error: unknown): string {
  const text = error instanceof Error ? error.message : String(error);

  if (text.includes('_slug_format')) {
    return 'The slug must be lowercase letters, numbers and single hyphens.';
  }
  if (text.includes('_published_has_date')) {
    return 'Published content needs a date. Use Publish rather than setting the status by hand.';
  }
  if (text.includes('unique') || text.includes('duplicate key')) {
    return 'Something with that slug already exists.';
  }

  return 'The database rejected that change, so nothing was saved.';
}
