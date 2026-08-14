import { describedBy, FieldShell, inputClass } from './field-shell';
import type { FieldProps } from './types';

/** Single-line text. Also used for numbers, via `type`. */
export function TextField({
  spec,
  defaultValue,
  error,
  type = 'text',
}: FieldProps & { type?: 'text' | 'number' }) {
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
        type={type}
        defaultValue={defaultValue}
        required={spec.required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(spec.name, spec.hint, error)}
        className={`${inputClass} ${type === 'number' ? 'numeric' : ''}`}
      />
    </FieldShell>
  );
}
