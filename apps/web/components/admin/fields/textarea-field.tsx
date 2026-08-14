import { describedBy, FieldShell, inputClass } from './field-shell';
import type { FieldProps } from './types';

/** Short prose: excerpts, summaries, bios, meta descriptions. */
export function TextareaField({ spec, defaultValue, error }: FieldProps) {
  return (
    <FieldShell
      name={spec.name}
      label={spec.label}
      hint={spec.hint}
      error={error}
      required={spec.required}
    >
      <textarea
        id={spec.name}
        name={spec.name}
        rows={3}
        defaultValue={defaultValue}
        required={spec.required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(spec.name, spec.hint, error)}
        className={inputClass}
      />
    </FieldShell>
  );
}
