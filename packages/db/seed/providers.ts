/**
 * Payment providers — docs/API.md §5, docs/CHART_OF_ACCOUNTS.md §§9.2–9.5, §10.
 *
 * `maxAmountMinor` is left NULL deliberately. Wallets do have per-transaction
 * limits (API.md §8), but no document here states the numbers, and inventing a
 * routing limit is the kind of guess RULES.md §1 forbids. Set them once the
 * founder confirms each provider's contracted limit.
 */
import type { paymentProviders } from '../schema/providers';

type ProviderSeed = typeof paymentProviders.$inferInsert;

export const providerSeeds: ProviderSeed[] = [
  {
    id: 'manual_qr',
    displayName: 'Bank QR (manual confirmation)',
    isActive: true,
    // Proof is approved by an admin; the money lands in the bank directly.
    balanceAccount: '1020',
    feeAccount: '5010',
    supportsRefund: false,
    supportsCallback: false,
    requiresPolling: false,
    sortOrder: 30,
  },
  {
    id: 'khalti',
    displayName: 'Khalti',
    // Enabled once production credentials arrive (MEMORY.md, blocked items).
    isActive: false,
    balanceAccount: '1032',
    feeAccount: '5010',
    supportsRefund: true,
    // Khalti has no webhook: polling IS the confirmation path.
    supportsCallback: false,
    requiresPolling: true,
    pollIntervalSec: 60,
    pollTimeoutSec: 3600,
    sortOrder: 10,
  },
  {
    id: 'esewa',
    displayName: 'eSewa',
    isActive: false,
    balanceAccount: '1031',
    feeAccount: '5010',
    supportsRefund: false,
    supportsCallback: true,
    // A suppressed callback must still be recovered by polling.
    requiresPolling: true,
    pollIntervalSec: 60,
    pollTimeoutSec: 3600,
    sortOrder: 20,
  },
  {
    id: 'fonepay',
    displayName: 'Fonepay',
    // Phase 9, behind a feature flag. Gated on bank credentials.
    isActive: false,
    balanceAccount: '1033',
    feeAccount: '5010',
    supportsRefund: false,
    supportsCallback: false,
    requiresPolling: true,
    sortOrder: 40,
  },
];
