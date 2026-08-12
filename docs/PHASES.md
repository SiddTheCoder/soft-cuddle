# Phases

Nine phases. **Do not begin a phase until the previous one's acceptance criteria
pass.** Each phase ends with something demonstrable.

Mark progress in `MEMORY.md`, not here.

---

## Phase 1 — Foundation

Nothing works yet, but everything stands on this.

**Build**

- pnpm workspaces + Turborepo, all packages scaffolded
- `packages/db`: Drizzle schema translated from `schema.sql`, migrations,
  local/production driver switch
- Apply the schema; verify every trigger and constraint exists
- Seed: chart of accounts, fiscal periods for the current BS year, products,
  payment providers
- `packages/accounting`: `postJournal()`, fiscal period resolution, journal
  numbering
- Auth.js: email + argon2id + mandatory TOTP, encrypted TOTP secrets
- Audit logging helper
- `middleware.ts` subdomain routing, all four route groups reachable
- Admin shell: navigation, layout, session guard
- GitHub Actions: typecheck, lint, test, migrate-check
- Sentry

**Accept when**

1. A manual journal entry posts and appears in `v_trial_balance`
2. An unbalanced journal is rejected **by the database**, not by app code
3. `UPDATE` and `DELETE` on `ledger_entries` both fail
4. Admin login requires TOTP; an active admin without TOTP cannot be created
5. All four subdomains route correctly
6. `v_unbalanced_journals` returns zero rows
7. CI green

---

## Phase 2 — Public site + CMS

**Build**

- CMS models: pages, blog posts, team members, services, products, legal docs
- Admin editors for each, with draft/publish
- Design system from `DESIGN.md` implemented as Tailwind tokens
- All public pages consuming CMS content
- Contact form: DB + email, rate-limited, honeypot
- SEO: metadata, Open Graph, sitemap, robots.txt
- R2 public bucket for CMS images

**Accept when**

1. A founder edits every page and legal document without a deploy
2. A team member is added and appears on the site
3. A blog post drafts, previews, and publishes
4. Lighthouse ≥ 95 performance and accessibility
5. Keyboard navigable, visible focus, `prefers-reduced-motion` respected
6. Contact form rate limit works; honeypot rejects bots

---

## Phase 3 — Payment core + manual QR

The first real money moves here. Take your time.

**Build**

- `packages/payment-core`: session creation, state machine, provider interface
- Application registration, credential issue/rotate/revoke, scope enforcement
- `POST /api/v1/checkout` with idempotency
- Checkout page: session lookup, expiry handling, provider selection by amount
- `manual_qr` adapter: QR display, proof upload to R2 (presigned PUT), pending
  state
- Admin approval queue: view proof via presigned GET, approve or reject
- Journal posting on approval (`CHART_OF_ACCOUNTS.md` §9.3)
- Outbound webhooks: signing, QStash delivery, retry, admin replay
- `packages/sdk` with typed client
- Jobs: `expire-stale-sessions`, `retry-webhooks`, `heartbeat`

**Accept when**

1. A registered SaaS creates a session and receives a checkout URL
2. A customer pays by manual QR and uploads proof
3. An admin approves it; the ledger balances; the invoice is marked paid
4. The SaaS receives a signed webhook and verifies the signature
5. The same `Idempotency-Key` twice returns the same session, not two
6. Application A cannot read application B's transactions
7. An expired session cannot be paid
8. The proof file is not reachable without an authenticated presigned URL

---

## Phase 4 — Khalti

**Build**

- Khalti adapter: `initiate()`, `poll()`, `refund()`
- `/epayment/initiate/` and `/epayment/lookup/`
- Status mapping (`API.md` §5.2)
- `poll-pending-transactions` job with exponential backoff
- Return-URL handler that triggers a lookup and **ignores query parameters**
- `provider_events` recording for every lookup
- Refund flow: request, approve, execute, ledger adjustment

**Accept when**

1. A sandbox payment completes end to end
2. Hitting the return URL with a forged `status=Completed` marks nothing paid
3. Five identical lookup results produce exactly one journal entry
4. A payment left pending is resolved by the polling job
5. A provider amount differing from expected sets `reconciliation_required` and
   posts nothing
6. `fee` from the lookup response lands in `provider_fee_minor`, not a computed
   percentage
7. A refund posts the correct reversing entries

---

## Phase 5 — eSewa

**Build**

- HMAC-SHA256 signature generation and verification (`API.md` §5.3)
- Intent flow: book, deeplink, status, cancel
- ePay flow: signed form POST redirect
- UA detection routing mobile → Intent, desktop → ePay
- Callback handler: verify → persist → enqueue → 200, under 200ms
- 5-minute fallback to status check
- Status mapping

**Accept when**

1. Both flows complete in sandbox
2. An invalid signature is rejected before any processing
3. A suppressed callback is recovered by polling within 6 minutes
4. Mobile UA routes to Intent, desktop to ePay
5. The callback handler responds in under 200ms
6. A replayed callback produces no second journal entry

---

## Phase 6 — Invoicing + subscriptions

**Build**

- Invoice creation, issue, gapless numbering per fiscal year
- Invoice PDF generation to R2
- Deferred revenue on subscription invoices (§9.1)
- `recognize-revenue` monthly job (§9.4)
- Subscription model: periods, renewal, grace, suspension
- `generate-renewal-invoices`, `send-dunning-reminders`, `suspend-past-grace`
- Agency invoices with TDS withholding (§9.7)
- Email templates

**Accept when**

1. An NPR 12,000 annual subscription posts to deferred revenue, not revenue
2. Monthly recognition releases exactly NPR 1,000 to account 4010
3. Renewal invoices generate before period end
4. Dunning fires at 7/3/1 days, then grace, then suspension
5. Invoice numbers are gapless and unique within the fiscal year
6. TDS on an agency payment lands in account 1210
7. A generated PDF matches the invoice record

---

## Phase 7 — Accounting depth

**Build**

- Chart of accounts management (add leaf accounts, never edit posted history)
- General ledger, journal browser with drill-through
- Trial balance, P&L, balance sheet
- Product-level P&L via the `product_id` dimension
- AR aging, expenses, AP, vendor bills
- Payroll as simple expense records (§9.8)
- Period close with posting lock
- Reconciliation runs and exception workflow
- Turnover tracking vs. VAT threshold
- CSV export for the accountant

**Accept when**

1. P&L and balance sheet tie to the trial balance, to the paisa
2. A closed period rejects new postings
3. Reconciliation flags a seeded mismatch and does not auto-resolve it
4. Product P&L across all products sums to company P&L
5. A reversing entry corrects a mistake with both entries visible
6. Export opens cleanly in a spreadsheet

---

## Phase 8 — Client portal

**Build**

- Client accounts created by the founder
- Projects, stages, milestones, deliverables
- Document area (R2 private, presigned)
- Message thread
- Invoice and payment visibility
- Admin project management

**Accept when**

1. A client sees only their own projects, verified by an isolation test
2. Changing a URL identifier returns 404, not another client's data
3. Documents are unreachable without a presigned URL
4. A founder updates a stage and the client sees it

---

## Phase 9 — Fonepay

Gated on bank credentials and the bank's integration document.

**Build**

- Adapter behind a feature flag
- Dynamic QR generation
- PG redirect flow
- HMAC verification per the bank's spec
- Confirmation path once known (callback vs. polling)

**Accept when**

1. A sandbox payment completes
2. Amount-based routing surfaces Fonepay for amounts above wallet limits
3. Reconciliation includes Fonepay settlement

**Do not guess at Fonepay request shapes.** Ask.

---

## Ongoing after each phase

- Update `MEMORY.md` and `CHANGELOG.md`
- Run the full suite against a Neon branch, not just local Postgres — the HTTP
  driver handles transactions differently and a phase must not be accepted
  without confirming behaviour there
- Confirm no secret reaches a client bundle
- Confirm `v_unbalanced_journals` is empty
