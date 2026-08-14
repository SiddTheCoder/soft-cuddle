'use client';

import { useActionState } from 'react';

import type { ContentRow, FieldSpec } from '@/lib/cms';
import { saveContent } from '@/app/(admin)/admin/cms/actions/save';
import { Field } from '@/components/admin/fields';
import { SubmitButton } from '@/components/admin/submit-button';

/**
 * The edit form. Renders whatever fields the content kind declares, so a new
 * kind needs no change here.
 *
 * Values come back from the server on a failed save, so a rejected form does
 * not lose what was typed.
 */
export function ContentForm({
  kindSlug,
  fields,
  row,
  uploadEnabled,
}: {
  kindSlug: string;
  fields: FieldSpec[];
  row: ContentRow;
  /** Decided on the server: image fields offer an upload only when R2 exists. */
  uploadEnabled: boolean;
}) {
  const [state, action] = useActionState(saveContent, undefined);

  return (
    <form action={action} className="mt-6">
      <input type="hidden" name="kind" value={kindSlug} />
      <input type="hidden" name="id" value={row.id} />

      {fields.map((spec) => (
        <Field
          key={spec.name}
          spec={spec}
          defaultValue={formatValue(row[spec.name])}
          error={state?.fieldErrors?.[spec.name]}
          uploadEnabled={uploadEnabled}
        />
      ))}

      <div className="mt-6 flex items-center gap-3">
        <SubmitButton>Save</SubmitButton>

        {state?.message ? (
          <p
            role="status"
            className={`text-sm ${state.ok ? 'text-muted-foreground' : 'text-destructive'}`}
          >
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}

/** Database value → form value. Arrays are the only special case today. */
function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return value.join(', ');
  return String(value);
}
