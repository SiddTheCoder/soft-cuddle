'use client';

import { useActionState } from 'react';

import { submitContact } from '@/app/(public)/contact/actions';
import { SubmitButton } from '@/components/admin/submit-button';

const inputClass =
  'mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ' +
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring';

export function ContactForm() {
  const [state, action] = useActionState(submitContact, undefined);

  return (
    <form action={action} className="mt-8 max-w-lg">
      {/*
       * Honeypot. Hidden from people with CSS and from screen readers with
       * aria-hidden + tabIndex, so it never reaches a real visitor — but it is
       * a normal field in the DOM, which is all a naive bot looks at.
       */}
      <div className="absolute left-[-9999px]" aria-hidden>
        <label htmlFor="website">Leave this field empty</label>
        <input
          id="website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <Field
        name="name"
        label="Name"
        required
        error={state?.fieldErrors?.name}
      />
      <Field
        name="email"
        label="Email"
        type="email"
        required
        error={state?.fieldErrors?.email}
      />
      <Field
        name="phone"
        label="Phone"
        type="tel"
        error={state?.fieldErrors?.phone}
      />
      <Field
        name="subject"
        label="Subject"
        error={state?.fieldErrors?.subject}
      />

      <div className="mt-4">
        <label htmlFor="message" className="block text-sm font-medium">
          Message{' '}
          <span className="text-destructive" aria-hidden>
            *
          </span>
        </label>
        <textarea
          id="message"
          name="message"
          rows={6}
          required
          aria-invalid={state?.fieldErrors?.message ? true : undefined}
          aria-describedby={
            state?.fieldErrors?.message ? 'message-error' : undefined
          }
          className={inputClass}
        />
        {state?.fieldErrors?.message ? (
          <p id="message-error" className="mt-1 text-xs text-destructive">
            {state.fieldErrors.message}
          </p>
        ) : null}
      </div>

      <div className="mt-6 flex items-center gap-3">
        <SubmitButton>Send</SubmitButton>

        {state?.message ? (
          <p
            role="status"
            className={`text-sm ${state.ok ? 'text-credit' : 'text-destructive'}`}
          >
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}

function Field({
  name,
  label,
  type = 'text',
  required,
  error,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  error?: string | undefined;
}) {
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
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${name}-error` : undefined}
        className={inputClass}
      />
      {error ? (
        <p id={`${name}-error`} className="mt-1 text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
