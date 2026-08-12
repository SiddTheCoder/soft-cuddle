# Changelog

Notable changes to the Softmato platform.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning is by phase until v1.0.

**Add an entry whenever something ships.** `MEMORY.md` tracks working state;
this file tracks what was delivered.

---

## [Unreleased]

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

### Notes
- Chart of accounts is a working draft pending review by a licensed accountant.
- Design direction in `DESIGN.md` is a proposal pending founder approval.
- Fiscal periods are **not** seeded — blocked on the go-live date and a verified
  BS calendar. `pnpm db:seed` fails loudly rather than inventing dates.
- Known gap: a journal with no lines can still be committed. See `MEMORY.md`.

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
