'use client';

import { useActionState, useState } from 'react';

import { uploadCmsImage } from '@/app/(admin)/admin/cms/actions/upload';

import { describedBy, FieldShell, inputClass } from './field-shell';
import type { FieldProps } from './types';

/**
 * An image URL, with an upload alongside it when R2 is configured.
 *
 * The URL input is always present and always authoritative — the upload just
 * fills it in. That keeps the field usable before storage exists, and lets an
 * image hosted elsewhere be pasted in without a second code path.
 *
 * The upload is a nested form's action rather than the parent form's, because
 * a file input inside the content form would post the whole editor on every
 * image change.
 */
export function ImageField({
  spec,
  defaultValue,
  error,
  uploadEnabled = false,
}: FieldProps & { uploadEnabled?: boolean | undefined }) {
  const [url, setUrl] = useState(defaultValue);
  const [state, action, pending] = useActionState(uploadCmsImage, undefined);

  /*
   * A finished upload fills the URL input; the founder still has to Save.
   *
   * Adjusted during render rather than in an effect. The value has to remain
   * editable afterwards, so it cannot simply be derived — and an effect would
   * render once with the stale URL before correcting itself.
   * https://react.dev/learn/you-might-not-need-an-effect
   */
  const [lastHandled, setLastHandled] = useState(state);

  if (state !== lastHandled) {
    setLastHandled(state);
    if (state?.ok && state.url) setUrl(state.url);
  }

  return (
    <FieldShell
      name={spec.name}
      label={spec.label}
      hint={spec.hint}
      error={error}
      required={spec.required}
    >
      <input
        id={spec.name}
        name={spec.name}
        type="text"
        value={url}
        onChange={(event) => setUrl(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(spec.name, spec.hint, error)}
        className={inputClass}
      />

      {uploadEnabled ? (
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            aria-label={`Upload ${spec.label.toLowerCase()}`}
            className="text-xs"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;

              const data = new FormData();
              data.set('file', file);
              data.set('slug', file.name);
              action(data);
            }}
          />

          {pending ? (
            <span className="text-xs text-muted-foreground">Uploading…</span>
          ) : null}

          {state?.message ? (
            <span
              role="status"
              className={`text-xs ${state.ok ? 'text-muted-foreground' : 'text-destructive'}`}
            >
              {state.message}
            </span>
          ) : null}
        </div>
      ) : null}

      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt=""
          className="mt-3 max-h-32 rounded-md border border-border"
        />
      ) : null}
    </FieldShell>
  );
}
