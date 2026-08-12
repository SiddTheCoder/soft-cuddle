# Memory

**Running state of the project. Read this first every session. Update it last.**

The `AI_Project_Documentation_Guide` says not to create this until coding
starts. It's scaffolded here with the open questions already captured so nothing
is lost — fill in the rest as you build.

---

## Current status

**Phase:** 1 — Foundation, in progress
**Last session:** 2026-08-12 (session 1)
**Repo:** pushed to `origin/main` (`SiddTheCoder/soft-cuddle`)

**Next action:** confirm the CI run is green (acceptance 7), then Phase 2 —
but read "Blocked on the founder" first: two Phase 1 answers are still missing
and one of them stops any real journal being posted.

**Uncommitted at hand-off:** `packages/db/migrations/meta/0001_snapshot.json`
— corrects the snapshot chain so `drizzle-kit check` passes. CI runs that step,
so the first run will fail until this is committed.

**Development admin:** `admin@softmato.com` / `12345678`, TOTP enrolled.
Deliberately weak, local only — `pnpm admin:create` refuses a password under 12
characters unless `APP_ENV=local`. **This account must never exist in preview or
production.** Replace it before the first real deployment.

---

## Where the code is

| What | Where |
|---|---|
| Ledger primitive | `packages/accounting/post-journal.ts` |
| Gapless numbering | `packages/accounting/numbering.ts` |
| Schema (11 modules) | `packages/db/schema/` |
| The four guarantees | `packages/db/migrations/0001_ledger_guarantees.sql` |
| Ledger tests | `packages/db/tests/ledger.test.ts` |
| Auth (argon2id + TOTP) | `apps/web/lib/auth.ts` |
| Encryption at rest | `apps/web/lib/crypto.core.ts` |
| Subdomain routing | `apps/web/middleware.ts` |
| Admin shell | `apps/web/app/(admin)/admin/` |

```bash
pnpm install && pnpm dev      # localhost:3000, admin.localhost:3000
pnpm test                     # 23 tests, needs DATABASE_URL
pnpm db:migrate               # deliberate step, never automatic
pnpm admin:create -- --email <email> --name <name>   # ADMIN_PASSWORD in env
```

`.env.local` lives at the repository root (not in `apps/web`) and is loaded by
`next.config.ts`, both vitest configs, and the `tsx` scripts.

**Development admin:** `admin@softmato.com` / `12345678`, TOTP enrolled.
Deliberately weak, local only — `pnpm admin:create` refuses a password under 12
characters unless `APP_ENV=local`. **This account must never exist in preview or
production.** Replace it before the first real deployment.

---

## Phase progress

| Phase | Status | Notes |
|---|---|---|
| 1 — Foundation | 🟡 In progress | Everything built. Acceptance 1–6 verified end to end; 7 pending confirmation of the first CI run. |
| 2 — Public site + CMS | ⬜ Not started | |
| 3 — Payment core + manual QR | ⬜ Not started | |
| 4 — Khalti | ⬜ Not started | |
| 5 — eSewa | ⬜ Not started | |
| 6 — Invoicing + subscriptions | ⬜ Not started | |
| 7 — Accounting depth | ⬜ Not started | |
| 8 — Client portal | ⬜ Not started | |
| 9 — Fonepay | ⬜ Blocked | Awaiting bank credentials |

Legend: ⬜ not started · 🟡 in progress · ✅ accepted · 🔴 blocked

---

## Blocked on the founder

Nothing proceeds past the listed phase until these are answered.

| # | Question | Blocks | Status |
|---|---|---|---|
| 1 | Bank name for the account 1020 label | Phase 1 seed | ⬜ Open |
| 2 | Go-live date — to seed fiscal periods | Phase 1 seed | ⬜ Open |
| 3 | Opening balances (no accountant engaged yet) | Phase 7 | ⬜ Open |
| 4 | Are setup fees (4050) earned immediately or deferred? | Phase 6 | ⬜ Open |
| 5 | Keep or relax `refund_needs_second_person` with one founder? | Phase 4 | ⬜ Open |
| 6 | Import historical manual transactions, or start fresh with opening balances? *(recommendation: fresh)* | Phase 7 | ⬜ Open |
| 7 | Design direction in `DESIGN.md` — approve or change? | Phase 2 | ⬜ Open |
| 8 | Team member names, roles, bios, photos for the public site | Phase 2 | ⬜ Open |
| 13 | Verified BS→AD boundaries for the go-live fiscal year's twelve months. Needed alongside #2; the seeder refuses to guess. | Phase 1 seed | ⬜ Open |
| 14 | Should a journal with zero lines be rejected by the database? It currently is not — see "Things learned the hard way". Fixing it means a new constraint trigger on `journal_entries`. | Phase 1 | ⬜ Open |
| 15 | Per-transaction wallet limits for each provider, to populate `max_amount_minor`. Left NULL — no document states the numbers, so routing currently hides nothing. | Phase 3 | ⬜ Open |

## Blocked on external parties

| # | Item | Blocks | Status |
|---|---|---|---|
| 9 | eSewa production merchant credentials | Phase 5 go-live | ⏳ Applied |
| 10 | Khalti production merchant credentials | Phase 4 go-live | ⏳ Applied |
| 11 | Fonepay credentials + bank integration doc | Phase 9 | ⏳ Not started |
| 12 | Exact Khalti `Authorization` prefix — `key ` vs `Key ` | Phase 4 | ⬜ Verify on first integration |

---

## Decisions made

Record every decision here with its reason. Future sessions must not relitigate
these — if one looks wrong, ask before changing it.

| Date | Decision | Why |
|---|---|---|
| 2026-08-12 | PostgreSQL, not MongoDB | Balance constraint, immutability, and gapless numbering must be enforced by the database. MongoDB cannot express a cross-document balance rule. |
| 2026-08-12 | Vercel-only, no VPS | eSewa and Khalti authenticate by signature/secret key, not source IP. The only hard blocker didn't apply. |
| 2026-08-12 | Drizzle, not Prisma | Explicit SQL control needed for ledger transactions and `FOR UPDATE`. |
| 2026-08-12 | Cloudflare R2, not Vercel Blob | Zero egress, generous permanent free tier, S3-compatible, no platform lock-in. |
| 2026-08-12 | One monorepo, one Next.js app | Two founders. Shared types are the biggest bug-prevention win available. |
| 2026-08-12 | No auto-debit subscriptions | Nepali wallets have no reliable server-initiated charge. Customer initiates each payment. |
| 2026-08-12 | `manual_qr` as a first-class provider | Replaces today's flow and stays as a permanent fallback when a gateway is down. |
| 2026-08-12 | No platform fee between products | One legal entity — an inter-product fee nets to zero. Product P&L via ledger dimension instead. |
| 2026-08-12 | Fiscal periods seeded, not computed | BS month boundaries don't align with Gregorian and month lengths vary. |

---

## Things learned the hard way

Append anything surprising — a provider quirk, a driver difference, a
constraint that bit. This section is what stops the next session repeating a
mistake.

- **A journal with no lines commits successfully.** `DATABASE.md` §2.1 and
  `schema.sql` both claim the database rejects one. It does not.
  `assert_journal_balanced()` contains the check, but the trigger is
  `AFTER INSERT ON ledger_entries` — with zero lines it never fires, so the
  check is unreachable in exactly the case it describes. Not changed
  unilaterally (`RULES.md` §3); logged as open question 14. `postJournal()`
  rejects an empty line list, so no code path here can produce one today.
  A `test.fails` case in `packages/db/tests/ledger.test.ts` will turn red the
  moment the database starts enforcing it.
- **Neon no longer offers Postgres 16.** New projects start at 18. Nothing in
  the schema depends on 16.
- **Drizzle Kit cannot serialize a `bigint` literal default.** `.default(0n)`
  crashes the generator; use `.default(sql\`0\`)`. Money columns stay
  `mode: 'bigint'` regardless — that part is not negotiable.
- **Drizzle Kit cannot resolve `.js` import specifiers** in schema files. Schema
  modules use extensionless relative imports.
- **A hand-written migration needs its own snapshot with a correct chain.**
  Adding `0001_ledger_guarantees.sql` means adding a `meta/0001_snapshot.json`
  whose `prevId` is the previous snapshot's `id` and whose own `id` is fresh.
  Copying the previous snapshot verbatim makes `drizzle-kit check` fail with a
  "collision" error — which CI runs, so it fails the build rather than going
  unnoticed. Repeat this whenever another hand-written migration is added.

---

## Deviations from the docs

If reality forced a departure from `ARCHITECTURE.md`, `DESIGN.md`, or
`API.md`, record it here **and** update the source document. A silent
divergence between docs and code is how a project loses its plan.

- **Postgres 18, not 16.** `ENVIRONMENT.md` §1 pins local Postgres to
  `postgres:16-alpine` "to match Neon's major version". Neon's current minimum
  for new projects is 18, so `docker-compose.yml` now uses `postgres:18-alpine`
  and the development database is Neon 18.4. The intent of the doc — local and
  Neon on the same major — is preserved. `ENVIRONMENT.md` still says 16 and
  should be updated when someone next touches it.
- **Local hostnames are `*.localhost`, not `*.softmato.local`.**
  `ENVIRONMENT.md` §1 originally required four hosts-file entries. Browsers
  resolve any `*.localhost` name to 127.0.0.1 with no configuration, so the
  hosts step is gone and the doc is updated. `middleware.ts` only reads the
  leftmost label, so `admin.localhost` and `admin.softmato.com` follow the same
  path with no environment branching.
- **Route groups need a path prefix.** `FOLDER_STRUCTURE.md` shows
  `(admin)/page.tsx`, `(checkout)/…`, and `(portal)/…` each owning `/`. Next
  cannot resolve two route groups that both define the same path, so the
  surfaces live at `(admin)/admin/…`, `(checkout)/checkout/…`, and
  `(portal)/portal/…`, and `middleware.ts` rewrites the subdomain to that
  prefix. Browser URLs are unchanged — `admin.softmato.com/payments` still
  reads as `/payments`.
- **`middleware.ts` is deprecated in Next 16** in favour of `proxy.ts`. The
  file still works and emits a warning on every dev start. Left as
  `middleware.ts` to match `ARCHITECTURE.md` and `FOLDER_STRUCTURE.md`; rename
  both the file and the docs together when convenient, before Next removes it.
- **Local development runs against Neon, not Docker.** `ENVIRONMENT.md` assumes
  a local Docker Postgres. The development machine has neither Docker nor
  Postgres, so `DATABASE_URL` points at a Neon branch. `docker-compose.yml` is
  written and correct for anyone who does have Docker. A side benefit: the
  "must also pass against Neon" requirement in `PHASES.md` is satisfied by
  default.

---

## Session log

Newest first. Keep entries short.

### Session 1 — 2026-08-12

**Phase:** 1
**Completed:** Monorepo scaffolded (pnpm workspaces + Turborepo, Next.js 16 /
React 19 / Tailwind 4 in `apps/web`, six packages). `schema.sql` translated to
Drizzle across 11 schema modules. Migration `0000` generated, `0001` hand-written
for the triggers and views. Applied to a Neon branch. Chart of accounts (76
accounts), products, and providers seeded. `packages/accounting`: `postJournal()`,
fiscal period resolution, gapless numbering via a transaction-scoped advisory
lock. Ledger test suite passing against real Postgres, with global teardown
asserting `v_unbalanced_journals` is empty.

**Acceptance criteria:** 1, 2, 3, 6 pass. 4, 5, 7 not yet built.

**In progress:** nothing half-done. No payment path was opened.

**Learned:** see "Things learned the hard way" — the no-lines journal gap is the
one that matters.

**Blocked on:** open questions 2 and 13 (go-live date + BS calendar) stop fiscal
periods being seeded, which stops any real journal being posted. Question 14
(no-lines journal) needs a decision.

**Next:** Auth.js with argon2id and mandatory TOTP, encrypted TOTP secrets,
audit-logging helper, `middleware.ts` subdomain routing, admin shell, GitHub
Actions, Sentry.

---

### Session 0 — 2026-08-12 (planning)

Architecture, schema, chart of accounts, and this documentation set produced.
No code written. Provider API details confirmed against eSewa's and Khalti's
live documentation, not from memory.

**Next:** Phase 1 — scaffold the monorepo, translate `schema.sql` to Drizzle,
seed the chart of accounts, prove the ledger constraints work.

---

## Template for a new entry

```markdown
### Session N — YYYY-MM-DD

**Phase:** X
**Completed:** …
**In progress:** … (exact file and function, so the next session can resume)
**Learned:** …
**Blocked on:** …
**Next:** …
```
