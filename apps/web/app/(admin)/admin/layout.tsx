/**
 * admin.softmato.com — session guard + navigation.
 *
 * This is the authoritative gate. `middleware.ts` runs on the edge and is a
 * cheap first pass; this layout runs on the server and is what actually decides
 * whether a request sees admin data.
 *
 * `mfa` is checked explicitly rather than assumed from the presence of a
 * session. A session that did not clear TOTP must never reach /admin
 * (docs/TESTING.md §9).
 */
import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import { AdminNav } from '@/components/admin/admin-nav';

export default async function AdminLayout({ children }: LayoutProps<'/admin'>) {
  const session = await auth();

  if (!session?.user || session.user.mfa !== true) {
    redirect('/login');
  }

  return (
    <div className="flex min-h-full flex-1">
      <AdminNav />
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-neutral-200 px-6 py-3">
          <span className="text-sm text-neutral-500">Softmato admin</span>
          <span className="text-sm text-neutral-700">{session.user.email}</span>
        </header>
        <main className="flex-1 px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
