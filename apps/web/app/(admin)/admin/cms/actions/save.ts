'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@softmato/db';

import { recordAudit } from '@/lib/audit';
import { contentKind, getContent, tableFor } from '@/lib/cms';

import {
  databaseMessage,
  parseId,
  requireAdmin,
  requireKind,
  type ActionResult,
} from './shared';

/**
 * Saves an edit.
 *
 * Deliberately does not change publication state. Publishing is a separate
 * act, so a founder can revise a draft without wondering whether they just put
 * it on the internet.
 */
export async function saveContent(
  _previous: ActionResult | undefined,
  form: FormData,
): Promise<ActionResult> {
  const adminId = await requireAdmin();
  const kindSlug = requireKind(form.get('kind'));
  const id = parseId(form.get('id'));
  const kind = contentKind(kindSlug);

  const submitted = Object.fromEntries(
    kind.fields.map((f) => [f.name, String(form.get(f.name) ?? '')]),
  );

  const parsed = kind.schema.safeParse(submitted);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? '');
      fieldErrors[key] ??= issue.message;
    }
    return { ok: false, message: 'Nothing was saved.', fieldErrors };
  }

  const before = await getContent(kindSlug, id);
  if (!before) return { ok: false, message: 'That content no longer exists.' };

  const table = tableFor(kindSlug);

  try {
    await db
      .update(table)
      .set({
        ...(parsed.data as Record<string, unknown>),
        updatedBy: Number(adminId),
        updatedAt: new Date(),
      })
      .where(eq(table.id, id));
  } catch (error) {
    return { ok: false, message: databaseMessage(error) };
  }

  await recordAudit({
    actorType: 'admin',
    actorId: adminId,
    action: 'cms.update',
    resourceType: kindSlug,
    resourceId: String(id),
    beforeState: before,
    afterState: await getContent(kindSlug, id),
  });

  revalidatePath(`/admin/cms/${kindSlug}`);
  return { ok: true, message: 'Saved.' };
}
