'use client';

import { useFormStatus } from 'react-dom';

/**
 * Submit button that disables itself while the action is in flight.
 *
 * Separate from the form because `useFormStatus` only reports the status of a
 * parent form — it has to be its own component to work at all.
 */
export function SubmitButton({
  children,
  variant = 'primary',
}: {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}) {
  const { pending } = useFormStatus();

  const base =
    'rounded-md px-3 py-2 text-sm disabled:opacity-60 ' +
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2';

  const style =
    variant === 'primary'
      ? 'bg-primary text-primary-foreground'
      : 'border border-border';

  return (
    <button type="submit" disabled={pending} className={`${base} ${style}`}>
      {pending ? 'Working…' : children}
    </button>
  );
}
