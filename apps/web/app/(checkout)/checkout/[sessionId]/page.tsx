/**
 * payment.softmato.com/checkout/<sessionId>
 *
 * Placeholder. Session lookup, expiry handling, and provider selection by
 * amount are Phase 3 — no payment path is opened here.
 */
export default async function CheckoutPage({
  params,
}: PageProps<'/checkout/[sessionId]'>) {
  const { sessionId } = await params;

  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col justify-center px-6 py-24">
      <h1 className="text-xl font-semibold">Checkout</h1>
      <p className="mt-3 text-sm text-neutral-600">
        Payment sessions are not implemented yet (Phase 3).
      </p>
      {/* Session ids are unguessable but not secret — they are in the URL. */}
      <p className="mt-6 font-mono text-xs text-neutral-400">{sessionId}</p>
    </main>
  );
}
