# API

Two audiences: the SaaS products that consume `/api/v1`, and the provider
integrations this platform implements.

---

## 1. Conventions

- Base: `https://api.payment.softmato.com/v1` (routed to `/api/v1/*`)
- All requests and responses are JSON
- **Amounts are integers in paisa.** `500000` is NPR 5,000
- Timestamps are ISO 8601 UTC
- Every request needs `Authorization: Bearer <client_secret>`
- Mutating requests need `Idempotency-Key`

Error shape:

```json
{
  "error": {
    "code": "AMOUNT_MISMATCH",
    "message": "Provider reported an amount that differs from the invoice",
    "request_id": "req_01J..."
  }
}
```

| Code | HTTP |
|---|---|
| `UNAUTHENTICATED` | 401 |
| `INSUFFICIENT_SCOPE` | 403 |
| `RESOURCE_NOT_FOUND` | 404 |
| `IDEMPOTENCY_CONFLICT` | 409 |
| `VALIDATION_FAILED` | 422 |
| `RATE_LIMITED` | 429 |
| `PROVIDER_UNAVAILABLE` | 502 |

Never leak provider internals in `message`. Log the detail, return the code.

---

## 2. Authentication

Each SaaS gets a `client_id` and a secret. The secret is stored only as an
argon2id hash — it is displayed once at issue and never again.

Scopes: `payment:create`, `payment:read`, `invoice:create`, `invoice:read`,
`refund:request`, `customer:read`.

Never granted to a SaaS: refund approval, accounting access, cross-product
reads, provider configuration, admin anything.

Rotation issues a new secret with a 24-hour overlap. Revocation is immediate.

---

## 3. Endpoints

### `POST /v1/invoices` — scope `invoice:create`

```json
{
  "external_ref": "HH-2026-00123",
  "customer": { "external_ref": "cust_88", "name": "Ram Sharma",
                "email": "ram@example.com", "phone": "98XXXXXXXX" },
  "lines": [{ "description": "HostelHub Standard — 12 months",
              "quantity": 1, "unit_price_minor": 1200000 }],
  "service_starts_at": "2026-08-15T00:00:00Z",
  "service_ends_at": "2027-08-15T00:00:00Z",
  "due_at": "2026-08-22T00:00:00Z"
}
```

`service_starts_at`/`service_ends_at` drive deferred revenue. Omit for one-off
work. `external_ref` is unique per application — a repeat returns the existing
invoice.

### `POST /v1/checkout` — scope `payment:create`

```json
{
  "invoice_id": "inv_01J...",
  "return_url": "https://hostelhub.com/billing/return",
  "metadata": { "subscription_id": "sub_123" }
}
```

**Note there is no `amount` field.** The server reads it from the invoice.
A client-supplied amount would be a vulnerability.

```json
{
  "session_id": "cs_live_8f7d92a1...",
  "checkout_url": "https://payment.softmato.com/checkout/cs_live_8f7d92a1...",
  "expires_at": "2026-08-12T11:00:00Z",
  "allowed_providers": ["khalti", "esewa", "fonepay", "manual_qr"]
}
```

Server steps, in order: authenticate → check scope → validate → verify invoice
ownership → recompute amount → compute `allowed_providers` by amount → create
session (32+ bytes CSPRNG, 30-minute expiry).

### `GET /v1/transactions/:id` — scope `payment:read`

Returns status, amounts, fee, provider, timestamps. Scoped to the caller's own
application. This is the endpoint a SaaS uses to answer "is TXN-123 paid?"
rather than deciding for itself.

### `POST /v1/refunds` — scope `refund:request`

Creates a request only. A SaaS can never approve a refund; approval happens in
the admin panel.

---

## 4. Outbound webhooks

```
POST <application.webhook_url>
X-Softmato-Signature: <hex hmac-sha256 of "{timestamp}.{body}">
X-Softmato-Timestamp: 1754990400
```

```json
{
  "event": "payment.success",
  "transaction_id": "TXN-2082/83-00000001",
  "invoice_id": "HH-2026-00123",
  "amount": 1200000,
  "currency": "NPR",
  "status": "SUCCESS",
  "occurred_at": "2026-08-12T10:30:00Z"
}
```

Events: `payment.created`, `payment.pending`, `payment.success`,
`payment.failed`, `payment.cancelled`, `payment.expired`,
`payment.refund_created`, `payment.refunded`, `payment.partially_refunded`.

Consumers must verify the signature with `crypto.timingSafeEqual` and reject
timestamps older than 5 minutes. Document this in the SDK.

Delivery via QStash with exponential backoff. After 8 failures → `abandoned`
plus an admin alert. Always replayable from the admin panel.

---

## 5. Provider integrations

Adapter interface:

```ts
interface PaymentProvider {
  id: 'esewa' | 'khalti' | 'fonepay' | 'manual_qr'

  initiate(session: PaymentSession): Promise<{
    providerRef: string
    redirectUrl?: string
    deeplink?: string
    qrPayload?: string
    correlationId?: string
  }>

  handleCallback?(raw: unknown, headers: Headers): Promise<VerifiedResult>
  poll(txn: Transaction): Promise<VerifiedResult>      // mandatory
  cancel?(txn: Transaction): Promise<void>
  refund?(txn: Transaction, amountMinor: bigint): Promise<RefundResult>
}

type VerifiedResult = {
  status: 'pending' | 'succeeded' | 'failed' | 'cancelled' | 'expired' | 'refunded'
  grossAmountMinor: bigint
  providerFeeMinor: bigint
  providerTxnId?: string
  raw: unknown
}
```

`poll()` is mandatory for every provider. It is the universal safety net and,
for Khalti, the only confirmation path.

---

### 5.1 `manual_qr`

Replaces the current manual process; remains a permanent fallback.

1. Customer selects Manual QR
2. Page shows the company QR and a reference code
3. Customer pays, uploads a screenshot via presigned PUT to the R2 private
   bucket
4. Transaction → `pending`, enters the admin approval queue
5. Admin verifies against the bank/wallet app, approves or rejects
6. Approval posts the journal entry and fires the webhook

`poll()` returns the current DB status — no external call.
`provider_fee_minor` is 0. Approval writes an audit entry naming the admin.

---

### 5.2 Khalti (KPG v2)

**Khalti does not push webhooks.** Confirmation is redirect-then-lookup plus
scheduled polling.

- Sandbox `https://dev.khalti.com/api/v2/`
- Production `https://khalti.com/api/v2/`
- Auth: secret key in the `Authorization` header.
  **Verify the exact prefix (`key ` vs `Key `) against live docs on first
  integration — published examples differ.**

**Initiate** — `POST /epayment/initiate/`

```json
{
  "return_url": "https://payment.softmato.com/checkout/<session_id>/return",
  "website_url": "https://softmato.com",
  "amount": 1200000,
  "purchase_order_id": "<session_id>",
  "purchase_order_name": "HostelHub Standard",
  "customer_info": { "name": "...", "email": "...", "phone": "..." }
}
```

Returns `pidx` and `payment_url`. Store `pidx` as `provider_ref`; redirect to
`payment_url`.

**Verify** — `POST /epayment/lookup/` with `{ "pidx": "..." }`. Response
includes `status`, `total_amount`, `transaction_id`, `fee`, `refunded`.

| Khalti | Ours |
|---|---|
| `Initiated` | `created` |
| `Pending` | `pending` |
| `Completed` | `succeeded` |
| `Refunded` | `refunded` |
| `Expired` | `expired` |
| `User canceled` | `cancelled` |

**Only `Completed` is success.** Take `fee` directly into `provider_fee_minor`.
Payment links expire after 60 minutes, so session TTL must be ≤ 30 minutes.

The return URL carries `status=Completed` in the query string. **It is
forgeable. Ignore it entirely** except as a trigger to run `poll()`.

Refunds are supported via API.

---

### 5.3 eSewa

Two flows — detect and route:

```ts
const isMobileUA    = /Android|iPhone|iPad|iPod|Mobile/i.test(userAgent)
const isTouchDevice = navigator.maxTouchPoints > 0
const isSmallScreen = window.innerWidth <= 768
const useIntent     = isMobileUA && isTouchDevice && isSmallScreen
```

Mobile → **Intent** (deeplink into the eSewa app). Desktop → **ePay** (signed
form POST redirect).

**Signature** — HMAC-SHA256, base64-encoded, over a comma-joined string whose
fields and order come from `signed_field_names`:

```
product_code=INTENT,amount=100,transaction_uuid=txn-20251220-001
```

Development access key, published by eSewa:
`LB0REg8HUSw3MTYrI1s6JTE8Kyc6JyAqJiA3MQ==`

**Intent endpoints** (sandbox base `https://rc-checkout.esewa.com.np`):

| Purpose | Endpoint |
|---|---|
| Book | `POST /api/client/intent/payment/book` |
| Status | `POST /api/client/intent/payment/status` |
| Cancel | `POST /api/client/intent/payment/cancel` |

Book returns `booking_id`, `deeplink`, `correlation_id`. Store `booking_id` as
`provider_ref`, `correlation_id` as `provider_correlation_id`.

**Callback** — eSewa POSTs a signed payload containing `product_code`, `amount`,
`reference_code`, `correlation_id`, `status`, `signature`,
`signed_field_names`. Verify the signature first, before anything else.

If no callback arrives within 5 minutes, poll the status endpoint.

| eSewa | Ours |
|---|---|
| `BOOKED` | `created` |
| `PENDING` | `pending` |
| `SUCCESS` | `succeeded` |
| `FAILED` | `failed` |
| `CANCELED` | `cancelled` |
| `REVERTED` | `refunded` |

Mobile SDKs are deprecated — do not use them.

---

### 5.4 Fonepay

Onboarded through the acquiring bank, not self-serve. Likely the highest-value
rail: businesses pay from bank accounts, and wallet limits can block larger
subscription amounts.

- PG redirect: `https://clientapi.fonepay.com`
- Dynamic QR: `https://merchantapi.fonepay.com`
- Auth: merchant code + shared secret, HMAC hash verification

Build the adapter shell with `poll()`. Leave `initiate()` behind a feature flag
until credentials and the bank's integration document arrive.

**Do not guess at Fonepay request shapes. Ask.**

---

## 6. Confirmation paths

**Callback handler** — must be fast:

```
1. Read raw body
2. Verify signature — reject immediately if invalid
3. INSERT into provider_events (unique constraint dedupes replays)
4. Enqueue to QStash
5. Return 200
```

Target under 200ms. Never process inline — providers time out and resend.

**Polling job** — every minute:

```sql
SELECT * FROM transactions
WHERE status IN ('created','pending')
  AND next_poll_at <= now()
ORDER BY next_poll_at
LIMIT 100
FOR UPDATE SKIP LOCKED;
```

Call `poll()`, record a `provider_events` row, apply the result. Exponential
backoff. After `poll_timeout_sec`, mark `expired`.

**Processing a verified success** — one database transaction:

```
SELECT … FOR UPDATE the transaction
already succeeded? → return (idempotent no-op)
amount mismatch?   → reconciliation_required, alert, STOP
update transaction (status, fee, net, provider_txn_id, succeeded_at)
postJournal(...)                    ← CHART_OF_ACCOUNTS.md §9.2 or §9.3
store journal_id on the transaction
update invoice paid_minor and status
insert webhook_deliveries row
insert audit_logs row
```

---

## 7. Rate limits

| Endpoint | Limit |
|---|---|
| `POST /v1/checkout` | 60/min per application |
| `GET /v1/*` | 300/min per application |
| Provider callbacks | 600/min per IP |
| Admin login | 5 per 15 min per IP, then lockout |
| Contact form | 3/hour per IP |

Upstash Redis. Return 429 with `Retry-After`.

---

## 8. Amount-based provider routing

`allowed_providers` is computed per session, never static:

```ts
const allowed = await db.query.paymentProviders.findMany({
  where: and(
    eq(isActive, true),
    lte(minAmountMinor, amount),
    or(isNull(maxAmountMinor), gte(maxAmountMinor, amount)),
  ),
})
```

Wallets have per-transaction limits. A customer must never select a method that
will fail mid-payment.
