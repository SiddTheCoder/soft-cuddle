# Graph Report - company  (2026-08-14)

## Corpus Check
- 119 files · ~49,756 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 705 nodes · 954 edges · 56 communities (50 shown, 6 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 13 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `normalized-for-git`
- Commit-specific freshness metadata is normalized for stable Git diffs.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 47|Community 47]]

## God Nodes (most connected - your core abstractions)
1. `Design` - 14 edges
2. `Coding Standards` - 13 edges
3. `[Phase 1] — 2026-08-14` - 12 edges
4. `Softmato Technology Pvt Ltd — Chart of Accounts & Posting Rules` - 12 edges
5. `Testing` - 12 edges
6. `products` - 11 edges
7. `9. Posting rules` - 11 edges
8. `Memory` - 11 edges
9. `Phases` - 11 edges
10. `Database` - 10 edges

## Surprising Connections (you probably didn't know these)
- `authorize()` --calls--> `verifyTotp()`  [INFERRED]
  apps/web/lib/auth.ts → apps/web/lib/totp.core.ts
- `publishContent()` --calls--> `tableFor()`  [INFERRED]
  apps/web/app/(admin)/admin/cms/actions/publish.ts → apps/web/lib/cms/registry.ts
- `publishContent()` --calls--> `getContent()`  [INFERRED]
  apps/web/app/(admin)/admin/cms/actions/publish.ts → apps/web/lib/cms/queries.ts
- `unpublishContent()` --calls--> `tableFor()`  [INFERRED]
  apps/web/app/(admin)/admin/cms/actions/publish.ts → apps/web/lib/cms/registry.ts
- `unpublishContent()` --calls--> `getContent()`  [INFERRED]
  apps/web/app/(admin)/admin/cms/actions/publish.ts → apps/web/lib/cms/queries.ts

## Communities (56 total, 6 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (45): closeDb(), db, DbTx, isNeon, AdminUser, adminUsers, AuditLog, auditLogs (+37 more)

### Community 1 - "Community 1"
Cohesion: 0.07
Nodes (30): publishContent(), unpublishContent(), saveContent(), ActionResult, databaseMessage(), parseId(), requireAdmin(), requireKind() (+22 more)

### Community 2 - "Community 2"
Cohesion: 0.05
Nodes (39): 10. Reconciliation targets, 11. Open items for the accountant, 1. Account numbering, 2. Assets, 3. Liabilities, 4. Equity, 5. Revenue, 6. Direct costs (+31 more)

### Community 3 - "Community 3"
Cohesion: 0.17
Nodes (21): optionalText, requiredText, SEO_FIELDS, seoSchema, slugSchema, SORT_ORDER_FIELD, sortOrderSchema, tagsSchema (+13 more)

### Community 4 - "Community 4"
Cohesion: 0.06
Nodes (29): 1. Principles, 2.1 A journal cannot commit unbalanced, 2.2 Ledger rows are immutable, 2.3 Closed periods reject postings, 2.4 An admin cannot exist without 2FA, 2. The four guarantees, 3. Ledger structure, 4. Tables that carry the most weight (+21 more)

### Community 5 - "Community 5"
Cohesion: 0.06
Nodes (31): 1. Conventions, 2. Authentication, 3. Endpoints, 4. Outbound webhooks, 5.1 `manual_qr`, 5.2 Khalti (KPG v2), 5.3 eSewa, 5.4 Fonepay (+23 more)

### Community 6 - "Community 6"
Cohesion: 0.08
Nodes (31): 10. Quality floor, 11. Before adding anything visual, 1. Direction: the ledger, 1. Direction: warm paper, quiet emerald, 2. Palette, 3. Typography, 4. The signature: greenbar tables, 4. The signature: ruled data tables (+23 more)

### Community 7 - "Community 7"
Cohesion: 0.07
Nodes (28): 10. Comments, 11. Commits, 12. Formatting, 1. TypeScript, 2. Money in code, 3. Validation, 4. Database access, 5. API routes (+20 more)

### Community 8 - "Community 8"
Cohesion: 0.1
Nodes (20): 10. Before accepting any phase, 11. What not to test, 1. Stack, 2. Ledger — must pass before any provider goes live, 3. Idempotency, 4. Forgery and trust, 5. Amount integrity, 6. Authorization (+12 more)

### Community 9 - "Community 9"
Cohesion: 0.14
Nodes (16): products, Application, APPLICATION_SCOPES, applications, ApplicationScope, Customer, customers, Invoice (+8 more)

### Community 10 - "Community 10"
Cohesion: 0.1
Nodes (19): 1. The company, 2. The problem, 3. What we're building, 4. Users, 5.1 Public site, 5.2 Payment platform, 5.3 Accounting, 5.4 Subscriptions (+11 more)

### Community 11 - "Community 11"
Cohesion: 0.16
Nodes (14): AccountingError, allocateDocumentNo(), allocateSequence(), COLUMN, formatDocumentNo(), SequenceKind, TABLE, WIDTH (+6 more)

### Community 12 - "Community 12"
Cohesion: 0.11
Nodes (17): 1. Shape of the system, 2. The central payment principle, 3. Payment flow, end to end, 4. Package boundaries, 5. Data flow into the ledger, 6. Background work, 7. Trust boundaries, 8. Why this shape (+9 more)

### Community 13 - "Community 13"
Cohesion: 0.14
Nodes (17): Added, Added, Added, Added, Changelog, code:markdown (## [Phase N] — YYYY-MM-DD), Entry template, Fixed (+9 more)

### Community 14 - "Community 14"
Cohesion: 0.13
Nodes (17): 1. Local setup, 2. Variables, 3. File storage, 4. Environments, 5. Deployment, 6. Cron, 7. Cost, 8. Secrets (+9 more)

### Community 15 - "Community 15"
Cohesion: 0.12
Nodes (17): Blocked on external parties, Blocked on the founder, code:bash (pnpm install && pnpm dev      # localhost:3000, admin.localh), code:markdown (### Session N — YYYY-MM-DD), Current status, Decisions made, Deviations from the docs, Memory (+9 more)

### Community 16 - "Community 16"
Cohesion: 0.22
Nodes (14): decryptSecret(), encryptSecret(), key(), timingSafeEquals(), createTotpEnrolment(), TotpEnrolment, totpFor(), verifyTotp() (+6 more)

### Community 17 - "Community 17"
Cohesion: 0.13
Nodes (13): FiscalPeriod, fiscalPeriods, periodStatus, entryDirection, journalEntries, JournalEntry, journalSource, LedgerEntry (+5 more)

### Community 18 - "Community 18"
Cohesion: 0.12
Nodes (16): `apps/web`, code:block1 (softmato/), code:block2 (apps/web/), code:block3 (db/), code:block4 (payment-core/), code:block5 (accounting/), code:block6 (sdk/), code:block7 (ui/) (+8 more)

### Community 19 - "Community 19"
Cohesion: 0.15
Nodes (10): ledgerEntries, AccountSeed, accountSeeds, ProductSeed, productSeeds, headers, insertJournal(), leaves (+2 more)

### Community 20 - "Community 20"
Cohesion: 0.38
Nodes (8): describedBy(), FieldShell(), Field(), MarkdownField(), TagsField(), TextField(), TextareaField(), FieldProps

### Community 21 - "Community 21"
Cohesion: 0.13
Nodes (14): deliveryStatus, idempotencyKeys, PaymentSession, paymentSessions, ProviderEvent, providerEvents, Refund, refunds (+6 more)

### Community 22 - "Community 22"
Cohesion: 0.16
Nodes (11): accounts, transactions, PaymentProvider, paymentProviders, ReconciliationItem, reconciliationItems, ReconciliationRun, reconciliationRuns (+3 more)

### Community 23 - "Community 23"
Cohesion: 0.14
Nodes (13): 1. When to stop and ask, 2. Money — absolute rules, 3. Never weaken a constraint, 4. Libraries, 5. Error handling, 6. Security, 7. Wrong even if it works, 8. Working method (+5 more)

### Community 24 - "Community 24"
Cohesion: 0.17
Nodes (11): Ongoing after each phase, Phase 1 — Foundation, Phase 2 — Public site + CMS, Phase 3 — Payment core + manual QR, Phase 4 — Khalti, Phase 5 — eSewa, Phase 6 — Invoicing + subscriptions, Phase 7 — Accounting depth (+3 more)

### Community 25 - "Community 25"
Cohesion: 0.22
Nodes (8): Account, accountClass, normalBalance, Product, productKind, vProductPl, vTrialBalance, vUnbalancedJournals

### Community 26 - "Community 26"
Cohesion: 0.33
Nodes (6): config, middleware(), SUBDOMAIN_SURFACE, Surface, SURFACE_PREFIX, surfaceFor()

### Community 27 - "Community 27"
Cohesion: 0.29
Nodes (5): Always read graph nodes before editing, graphify - READ THIS FIRST then docs folder PHASES.md, Keeping the graph fresh, What you MUST do at the start of every session, What you MUST NOT do

### Community 28 - "Community 28"
Cohesion: 0.33
Nodes (4): dmSans, inter, metadata, plexMono

### Community 29 - "Community 29"
Cohesion: 0.4
Nodes (3): AdminNav(), NavItem, SECTIONS

### Community 30 - "Community 30"
Cohesion: 0.33
Nodes (4): env, hex32, publicSchema, serverSchema

### Community 31 - "Community 31"
Cohesion: 0.33
Nodes (3): cjsRequire, loaded, MONTH_NAMES

### Community 32 - "Community 32"
Cohesion: 0.4
Nodes (4): code:bash (npm run dev), Deploy on Vercel, Getting Started, Learn More

### Community 33 - "Community 33"
Cohesion: 0.4
Nodes (4): Before you end a session, Before you start a session, Softmato Platform — Documentation, The one-paragraph version

### Community 34 - "Community 34"
Cohesion: 0.5
Nodes (3): envPath, [, key, rawValue], match

### Community 35 - "Community 35"
Cohesion: 0.5
Nodes (3): JWT, Session, User

### Community 36 - "Community 36"
Cohesion: 0.5
Nodes (3): envPath, [, key, rawValue], match

## Knowledge Gaps
- **325 isolated node(s):** `eslintConfig`, `Surface`, `SUBDOMAIN_SURFACE`, `SURFACE_PREFIX`, `config` (+320 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `tableFor()` connect `Community 1` to `Community 3`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **Why does `authorize()` connect `Community 1` to `Community 16`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `Surface`, `SUBDOMAIN_SURFACE` to the rest of the system?**
  _325 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `Community 4` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._