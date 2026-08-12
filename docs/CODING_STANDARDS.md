# Coding Standards

---

## 1. TypeScript

`strict: true`, plus:

```json
{
  "noUncheckedIndexedAccess": true,
  "noImplicitOverride": true,
  "exactOptionalPropertyTypes": true,
  "verbatimModuleSyntax": true
}
```

**No `any`.** Use `unknown` and narrow. If a third-party type is wrong, write a
local declaration rather than casting.

**No non-null assertion (`!`) on anything financial.** Handle the null.

```ts
// Wrong
const txn = await getTransaction(id)!

// Right
const txn = await getTransaction(id)
if (!txn) throw new PaymentError('RESOURCE_NOT_FOUND', `No transaction ${id}`)
```

Type inference where it's obvious, explicit return types on exported functions.

---

## 2. Money in code

**Every monetary value is `bigint`.**

```ts
const amountMinor: bigint = 500000n        // NPR 5,000.00
```

Rules:

```ts
// ✓ arithmetic stays in bigint
const netMinor = grossMinor - feeMinor

// ✗ never convert to number for maths
const net = Number(grossMinor) - Number(feeMinor)

// ✗ never parse a float into paisa
const minor = BigInt(Math.round(parseFloat(input) * 100))
```

Parse user-entered amounts as a decimal string, split on the point, never touch
`parseFloat`:

```ts
export function parseNPRToMinor(input: string): bigint {
  const cleaned = input.replace(/[,\s]/g, '')
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) {
    throw new ValidationError('Enter an amount like 5000 or 5000.50')
  }
  const [rupees, paisa = ''] = cleaned.split('.')
  return BigInt(rupees) * 100n + BigInt(paisa.padEnd(2, '0'))
}
```

**Variable names carry the unit.** `amountMinor`, `feeMinor`, `netMinor`.
Never a bare `amount`.

JSON has no bigint. Serialize as a number at the API boundary (safe: paisa
amounts stay far below `Number.MAX_SAFE_INTEGER`), and convert back to `bigint`
immediately on receipt. Do this in one place, not scattered.

---

## 3. Validation

Zod at every boundary. Never trust a parsed body.

```ts
const CreateCheckoutSchema = z.object({
  invoice_id: z.string().min(1),
  return_url: z.string().url().optional(),
  metadata: z.record(z.unknown()).default({}),
})
// note: no amount field — the server reads it from the invoice
```

Validate: API request bodies, provider responses, webhook payloads, env vars at
boot, form input server-side (client validation is UX, not security).

Fail loudly on an env var that's missing or malformed — at startup, not at the
first payment.

---

## 4. Database access

**Transactions for anything financial.**

```ts
await db.transaction(async (tx) => {
  const [txn] = await tx
    .select().from(transactions)
    .where(eq(transactions.id, id))
    .for('update')                       // ← lock, always

  if (txn.status === 'succeeded') return  // idempotent no-op

  await tx.update(transactions).set({ ... }).where(...)
  await postJournal(tx, { ... })
})
```

Rules:

- Always `SELECT … FOR UPDATE` before mutating a transaction row
- Never nest transactions — pass the `tx` handle down
- Never do network I/O inside a transaction (no provider calls, no email)
- Never `SELECT *` in production code — name the columns
- Prefer one query with a join over N+1

---

## 5. API routes

Thin. Parse, authenticate, delegate, serialize.

```ts
export async function POST(req: Request) {
  const requestId = crypto.randomUUID()
  try {
    const app  = await authenticateApplication(req)
    requireScope(app, 'payment:create')

    const body = CreateCheckoutSchema.parse(await req.json())
    const key  = req.headers.get('Idempotency-Key')
    if (!key) throw new PaymentError('VALIDATION_FAILED', 'Idempotency-Key required')

    const result = await withIdempotency(app.id, key, body, () =>
      createCheckoutSession(app, body),
    )
    return Response.json(result)
  } catch (err) {
    return handleApiError(err, requestId)
  }
}
```

Business logic goes in `packages/*`. If a route handler exceeds ~40 lines, it's
doing too much.

---

## 6. Errors

```ts
export class PaymentError extends Error {
  constructor(
    readonly code: PaymentErrorCode,
    message: string,
    readonly context?: Record<string, unknown>,
  ) {
    super(message)
    this.name = 'PaymentError'
  }
}
```

Never swallow an error in a payment path. Never `catch { return null }` on
anything financial. Log with context, report to Sentry, rethrow so the
transaction rolls back.

**Fail closed.** If verification is uncertain, the payment is not successful.

Never leak internals to a client — log the detail, return a stable code and a
generic message. A provider error may contain merchant identifiers.

---

## 7. Logging

Structured. No `console.log` in committed code.

```ts
logger.info({
  transactionId: txn.txnNo,
  provider: 'khalti',
  status: result.status,
  amountMinor: result.grossAmountMinor.toString(),
}, 'payment verified')
```

Log every provider request and response, secrets redacted. On Vercel there is
no SSH — logs and `provider_events` are the only way to understand a failure
after the fact.

Never log: secrets, full card data, TOTP secrets, session cookies, argon2
hashes, or a full request body containing customer PII beyond what's needed.

---

## 8. Async

Always `await`. A floating promise in a payment path is a silent failure —
`no-floating-promises` is on as an error.

Parallelise independent work:

```ts
const [invoice, customer] = await Promise.all([
  getInvoice(id),
  getCustomer(customerId),
])
```

Set a timeout on every external call. A hanging provider request must not hold
a function open until Vercel kills it.

```ts
const controller = new AbortController()
const timer = setTimeout(() => controller.abort(), 15_000)
try {
  return await fetch(url, { signal: controller.signal, ... })
} finally {
  clearTimeout(timer)
}
```

---

## 9. React

Server Components by default. `'use client'` only for interactivity.

Data fetching in Server Components; mutations through Server Actions or route
handlers. **Never** call the payment API from a client component with a secret.

Keep components under ~150 lines. Extract when a file starts needing section
comments.

No `useEffect` for data fetching. No state that could be derived.

Every interactive element needs a visible focus style. Never `outline: none`
without a replacement.

---

## 10. Comments

Explain *why*, not *what*. Assume the reader can read TypeScript.

```ts
// Khalti returns the fee in the lookup response. Never compute it as a
// percentage — the rate is set by the merchant agreement and can change.
const feeMinor = BigInt(lookup.fee)
```

Every file in `accounting/rules/` starts with a reference to its section in
`CHART_OF_ACCOUNTS.md`.

Flag anything unresolved so it's greppable:

```ts
// TODO(founder): confirm whether setup fees defer across the term
// FIXME: Khalti Authorization prefix — 'key ' vs 'Key ', verify against live docs
```

---

## 11. Commits

Conventional commits, one concern each.

```
feat(payments): add Khalti lookup polling
fix(ledger): use FOR UPDATE when posting refund reversals
docs(memory): record phase 3 completion
```

Never commit: `.env`, secrets, `node_modules`, generated build output, a
migration that weakens a constraint from `DATABASE.md` §2.

Never leave a payment path half-implemented across a session boundary. Finish
it or revert it.

---

## 12. Formatting

Prettier, ESLint, defaults except:

```
printWidth: 100
semi: false
singleQuote: true
trailingComma: 'all'
```

ESLint errors (not warnings): `no-floating-promises`, `no-explicit-any`,
`no-console`, `require-await`, `no-misused-promises`.
