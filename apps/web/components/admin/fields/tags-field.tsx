import { describedBy, FieldShell, inputClass } from './field-shell';
import type { FieldProps } from './types';

/**
 * Comma-separated in the form, an array in the database. The split happens in
 * the kind's schema (lib/cms/fields.ts), not here — this is only the input.
 */
export function TagsField({ spec, defaultValue, error }: FieldProps) {
  return (
    <FieldShell
      name={spec.name}
      label={spec.label}
      hint={spec.hint ?? 'Comma separated.'}
      error={error}
      required={spec.required}
    >
      <input
        id={spec.name}
        name={spec.name}
        type="text"
        defaultValue={defaultValue}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(spec.name, spec.hint, error)}
        className={inputClass}
      />
    </FieldShell>
  );
}
