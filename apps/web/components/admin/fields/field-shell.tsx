/**
 * Label, hint and error around any input.
 *
 * The label is always visible — never placeholder-as-label (docs/DESIGN.md §8).
 * The error names the problem rather than saying the value is invalid.
 */
export function FieldShell({
  name,
  label,
  hint,
  error,
  required,
  children,
}: {
  name: string;
  label: string;
  // `| undefined` is required by exactOptionalPropertyTypes: these are passed
  // through from optional FieldSpec properties, which may genuinely be absent.
  hint?: string | undefined;
  error?: string | undefined;
  required?: boolean | undefined;
  children: React.ReactNode;
}) {
  const hintId = hint ? `${name}-hint` : undefined;
  const errorId = error ? `${name}-error` : undefined;

  return (
    <div className="mt-4">
      <label htmlFor={name} className="block text-sm font-medium">
        {label}
        {required ? (
          <span className="text-destructive" aria-hidden>
            {' '}
            *
          </span>
        ) : null}
      </label>

      {children}

      {hint ? (
        <p id={hintId} className="mt-1 text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}

      {error ? (
        <p id={errorId} className="mt-1 text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Shared input styling, so every field looks and focuses the same. */
export const inputClass =
  'mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ' +
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring';

/** Describes an input by its hint and error, for screen readers. */
export function describedBy(
  name: string,
  hint?: string,
  error?: string,
): string | undefined {
  const ids = [hint ? `${name}-hint` : null, error ? `${name}-error` : null]
    .filter(Boolean)
    .join(' ');

  return ids || undefined;
}
