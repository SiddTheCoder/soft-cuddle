/**
 * Admin sign-in. Email, password, and authenticator code in one step — there
 * is no partially-authenticated state to mishandle.
 */
import { AuthError } from 'next-auth';
import { redirect } from 'next/navigation';

import { signIn } from '@/lib/auth';

export default function LoginPage() {
  async function authenticate(formData: FormData): Promise<void> {
    'use server';

    try {
      await signIn('credentials', {
        email: String(formData.get('email') ?? ''),
        password: String(formData.get('password') ?? ''),
        totp: String(formData.get('totp') ?? ''),
        redirectTo: '/admin',
      });
    } catch (error) {
      // next-auth signals a successful redirect by throwing; let that through.
      if (error instanceof AuthError) {
        // One message for every failure mode. Distinguishing "no such account"
        // from "wrong password" would let anyone enumerate admins.
        redirect('/login?error=1');
      }
      throw error;
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-24">
      <h1 className="text-xl font-semibold tracking-tight">Sign in</h1>

      <form action={authenticate} className="mt-6 space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm text-neutral-700">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            required
            className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm text-neutral-700">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="totp" className="block text-sm text-neutral-700">
            Authenticator code
          </label>
          <input
            id="totp"
            name="totp"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{6}"
            maxLength={6}
            required
            className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 font-mono text-sm"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded bg-neutral-900 px-3 py-2 text-sm font-medium text-white"
        >
          Sign in
        </button>
      </form>
    </main>
  );
}
