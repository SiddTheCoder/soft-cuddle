import { describedBy, FieldShell, inputClass } from './field-shell';
import type { FieldProps } from './types';

/**
 * Long-form body copy, written as Markdown.
 *
 * A plain textarea on purpose. A rich-text editor is a large dependency and a
 * source of markup the renderer then has to trust; Markdown keeps the stored
 * value something we can render server-side without trusting HTML. If a
 * preview or toolbar is wanted later, it belongs here and nowhere else.
 */
export function MarkdownField({ spec, defaultValue, error }: FieldProps) {
  return (
    <FieldShell
      name={spec.name}
      label={spec.label}
      hint={spec.hint ?? 'Markdown. Rendered on the site; HTML is not trusted.'}
      error={error}
      required={spec.required}
    >
      <textarea
        id={spec.name}
        name={spec.name}
        rows={14}
        defaultValue={defaultValue}
        required={spec.required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(spec.name, spec.hint, error)}
        className={`${inputClass} font-mono text-xs`}
      />
    </FieldShell>
  );
}
