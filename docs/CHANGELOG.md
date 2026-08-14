# Changelog

Notable changes to the Softmato platform.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning is by phase until v1.0.

**Add an entry whenever something ships.** `MEMORY.md` tracks working state;
this file tracks what was delivered.

---

## [Unreleased]

Nothing yet — Phase 2 begins here.

---

## [Phase 1] — 2026-08-14

Foundation accepted: all seven acceptance criteria in `PHASES.md` pass.

### Added
- Documentation set: PRD, architecture, rules, phases, database, API, design,
  folder structure, coding standards, environment, testing
- `schema.sql` — full PostgreSQL DDL with balance, immutability, period-lock,
  and 2FA constraints
- `CHART_OF_ACCOUNTS.md` — Nepali service-company chart of accounts and posting
  rules for every financial event
- Monorepo scaffold: pnpm workspaces + Turborepo, one Next.js app, six packages
- The books exist. A journal entry can be posted and read back from the trial
  balance, and the database refuses to record one that does not balance.
- Chart of accounts, products, and payment providers are loaded automatically
- Founders sign in with email, password, and an authenticator code, and reach
  an admin panel showing whether the ledger balances
- All four surfaces are reachable on their own subdomain: public site, admin,
  checkout, and client portal
- CI runs typecheck, lint, migrations, migrate-check, and the full test suite
  against a real Postgres on every push

### Security
- The four guarantees are live and verified against a real database: an
  unbalanced journal is rejected at COMMIT, posted ledger rows cannot be
  changed or removed, a closed period accepts nothing but a closing entry, and
  an active admin without 2FA cannot be created.
- A journal with no lines is now rejected at COMMIT by the database, not only
  by `postJournal()`. Guarantee 1 previously had a hole in exactly the case
  `DATABASE.md` §2.1 described.
- Header accounts reject postings; only leaf accounts accept them.
- Admin sign-in requires password **and** TOTP in a single step — there is no
  half-authenticated session. TOTP secrets are AES-256-GCM encrypted at rest.
- Login failures are indistinguishable between "no such account" and "wrong
  password", so the form cannot be used to enumerate admins. Every attempt,
  successful or not, is written to the append-only audit log with secrets
  redacted.
- The environment is validated at boot: a missing `ENCRYPTION_KEY` fails the
  build, not the first login. A preview deployment cannot start with
  `PAYMENT_MODE=live`.
- CI fails the build if a secret name appears in the client bundle.

### Migration
- `0000` — all tables, enums, checks, and indexes from `schema.sql`
- `0001` — hand-written: balance/immutability/period/postable triggers and the
  three reporting views. Drizzle Kit does not generate these; a regeneration
  must never drop them.
- `0002` — hand-written: `journal_entries_have_lines`, a deferred constraint
  trigger completing guarantee 1. Must stay deferred — `postJournal()` inserts
  the header before its lines within one transaction.

### Notes
- Chart of accounts is a working draft pending review by a licensed accountant.
- Design direction in `DESIGN.md` is a proposal pending founder approval.
- Fiscal periods for BS 2083/84 (17 Jul 2026 – 16 Jul 2027) are seeded, with
  boundaries generated from published BS calendar tables rather than typed by
  hand. Later years are not seeded; `pnpm db:seed` fails loudly for a year it
  has no verified calendar for, rather than inventing dates.

---

## Entry template

```markdown
## [Phase N] — YYYY-MM-DD

### Added
- New capability, from the user's point of view

### Changed
- Behaviour that differs from before

### Fixed
- Bug, with its user-visible symptom

### Security
- Anything affecting authentication, authorization, secrets, or money integrity

### Migration
- Schema changes and anything needed to deploy them
```

Rules for entries:

- Write from the user's side. "Founders can approve manual payments," not
  "added `POST /api/internal/approvals`."
- Every schema change gets a **Migration** note.
- Anything touching money integrity gets a **Security** note, even if it isn't a
  vulnerability.
- Never rewrite a shipped entry. Correct it with a new one.
