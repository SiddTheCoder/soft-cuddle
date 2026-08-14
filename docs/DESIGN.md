# Design

> **Approved 2026-08-14**, with the palette and typography replaced by the
> founder's reference project (`D:\Jiwan-Mijhar`). Follow this exactly — do not
> substitute defaults mid-build.
>
> The original proposal here was a greenbar-stationery direction built on
> `--ink` / `--paper` / `--bar` / `--tomato`. It was not adopted. What survives
> from it is everything that concerns reading money correctly: tabular mono
> figures, right-aligned amount columns, distinct credit/debit colour, and the
> structural (never hover-only) table band. Those are legibility requirements,
> not taste, and they carry over onto the new palette unchanged.

---

## 1. Direction: warm paper, quiet emerald

Warm off-white surfaces, a deep emerald primary, terracotta reserved for
emphasis, soft depth from long low-opacity shadows rather than hard borders.
Panels either float (`.glass-panel`, blurred translucent surface) or sit framed
(`.section-frame`, hairline border on solid warm paper). Headings are tightly
tracked; small uppercase mono eyebrows label real sections.

The product's subject is still a well-kept account book, and that shows in how
data is set rather than in the colour of the page: ruled columns, aligned
figures, corrections visible in the margin rather than rubbed out. The
stationery metaphor governs **tables and numbers** (§4, §5). It no longer
governs the palette.

Everything else stays quiet. Restraint over decoration.

---

## 2. Palette

Defined once as CSS custom properties in `apps/web/app/globals.css` and exposed
to Tailwind through `@theme inline`. **Read the tokens there, not a copy here** —
a palette duplicated into a doc is a palette that drifts. The shape:

| Token                            | Role                                             |
| -------------------------------- | ------------------------------------------------ |
| `--background` / `--foreground`  | Page ground and text                             |
| `--surface` / `--surface-strong` | Translucent glass panel / solid warm paper panel |
| `--card`, `--popover`            | Lifted containers                                |
| `--primary`                      | Emerald. Primary action.                         |
| `--accent-strong`                | Terracotta `#b84a1a`. Emphasis, never a number.  |
| `--teal`, `--sky`                | Secondary hues, sparingly                        |
| `--muted` / `--muted-foreground` | Recessed surfaces, secondary text                |
| `--border`, `--input`, `--ring`  | Hairlines and focus                              |
| `--destructive`                  | Destructive UI actions                           |
| `--credit` / `--flag`            | **Money in / money out.** See below.             |
| `--sidebar-*`                    | Admin navigation                                 |

**Colour carries meaning in this product.** `--credit` and `--flag` are not
decoration — green means money in, red means money out or something reversed.
Never use either for emphasis on non-financial text, and never set an amount in
`--accent-strong`. `--destructive` is for destructive _actions_ (delete, revoke);
`--flag` is for _figures_. They are different tokens on purpose.

Dark mode: the full dark palette ships in `globals.css` under `.dark`, but
nothing toggles it yet. Scope stays admin-only, deferred to Phase 7 — public and
checkout are light.

---

## 3. Typography

Three roles, three faces.

| Role       | Face                     | Source | Variable         | Use                                  |
| ---------- | ------------------------ | ------ | ---------------- | ------------------------------------ |
| Display    | **DM Sans**              | Google | `--font-heading` | Headings, page titles. Restraint.    |
| Body       | **Inter**                | Google | `--font-sans`    | All running text, UI labels, buttons |
| Data       | **IBM Plex Mono**        | Google | `--font-mono`    | Every number, ID, code, amount       |
| Devanagari | **Noto Sans Devanagari** | Google | —                | Fallback for Nepali text             |

Loaded in `apps/web/app/layout.tsx` via `next/font/google`, so they self-host and
cost no third-party request. DM Sans is used sparingly and always tightly
tracked (`.headline`, `-0.04em`). Inter stays out of the way. Plex Mono exists
for one reason, and it is the important one:

**Every number in this product is set in tabular mono.**

```css
font-variant-numeric: tabular-nums;
```

Amounts, transaction IDs, invoice numbers, account codes, dates. Digits must
align vertically in a column so a mis-keyed figure is visible at a glance. This
is not aesthetic preference — it is how you catch a NPR 50,000 that should have
been NPR 5,000.

Use the `.numeric` class (`globals.css`) rather than reaching for the font and
`font-variant-numeric` by hand. One class, one place to get it right.

### Scale

```css
--text-xs: 0.75rem / 1.4 /* captions, table meta */ --text-sm: 0.875rem / 1.5
  /* secondary, dense tables */ --text-base: 1rem / 1.6 /* body */
  --text-lg: 1.125rem / 1.5 /* lead paragraph */ --text-xl: 1.5rem / 1.3
  /* section head */ --text-2xl: 2rem / 1.2 /* page title */ --text-3xl: 3rem /
  1.1 /* hero, public only */;
```

Weights: 400 body, 500 UI labels, 600 display. Never 700+. Never faux-bold a
mono figure.

Tracking: display `-0.04em` (`.headline`). Body 0. Mono 0. All-caps mono
eyebrows `0.18em` (`.eyebrow`), and eyebrows appear only where they label a real
section, never as decoration.

---

## 4. The signature: ruled data tables

Where the account-book thinking still lives. The band is now a warm neutral
rather than green, but every rule below is unchanged — they are about reading a
row of figures correctly, not about the colour of the stock.

```
┌──────────────────────────────────────────────────────────────┐
│ DATE        TXN                PRODUCT     METHOD      AMOUNT│  ← mono caps, xs
├──────────────────────────────────────────────────────────────┤
│ 12 Bhadra   TXN-2082/83-00041  HostelHub   Khalti   12,000.00│  ← background
│ 12 Bhadra   TXN-2082/83-00042  QuestionCa… eSewa     2,500.00│  ← muted band
│ 11 Bhadra   TXN-2082/83-00043  HostelHub   Manual   45,000.00│  ← background
│ 11 Bhadra   TXN-2082/83-00044  HostelHub   Khalti  −3,000.00 │  ← band, flag
└──────────────────────────────────────────────────────────────┘
```

Rules:

- Odd rows `--background`, even rows `--muted`. Never a hover-only stripe — the
  band is structural, always visible.
- Column rules are 1px `--border`, vertical only between numeric columns where
  alignment matters. No full grid.
- Header row: `--muted-foreground`, `--text-xs`, uppercase mono, `0.18em`
  tracking, 1px bottom rule.
- **Every amount column is right-aligned, mono, tabular.** No exceptions.
- Negative amounts get `--flag` and a true minus sign `−` (U+2212), not a
  hyphen.
- Row height 40px desktop, 48px touch.
- No zebra _and_ border — the band replaces the border.

Used in: admin transaction lists, ledger and journal views, trial balance,
invoice line items, the checkout receipt summary, the public pricing block.

---

## 5. Money and date formatting

### NPR — South Asian digit grouping

Nepal groups digits as **lakh and crore**, not thousands. This is not optional
and it is the detail most likely to be got wrong.

```
✓  NPR 12,34,567.00        ✗  NPR 1,234,567.00
✓  NPR 45,000.00           ✗  NPR 45000
✓  NPR 1,00,000.00         ✗  NPR 100,000.00
```

Grouping runs 3 digits, then 2, then 2: `1,23,45,678`.

```ts
export function formatNPR(minor: bigint, opts?: { symbol?: boolean }): string {
  const negative = minor < 0n;
  const abs = negative ? -minor : minor;
  const rupees = abs / 100n;
  const paisa = abs % 100n;

  const s = rupees.toString();
  // last three digits, then pairs
  const head = s.slice(0, -3);
  const tail = s.slice(-3);
  const grouped = head
    ? head.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + tail
    : tail;

  const body = `${grouped}.${paisa.toString().padStart(2, '0')}`;
  return `${negative ? '−' : ''}${opts?.symbol === false ? '' : 'NPR '}${body}`;
}
```

**Never** use `Intl.NumberFormat('en-US')` for NPR. `en-IN` produces correct
grouping but verify the output before trusting it.

Always show two decimal places, even at `.00`. A ledger with ragged decimals is
unreadable.

### Dates

Display **BS primary, AD secondary**:

```
12 Bhadra 2082
12 Bhadra 2082 (28 Aug 2026)      ← where precision matters
2082/05/12                        ← dense tables, mono
```

Store UTC. Convert at render only. Fiscal year renders `2082/83`.

Month names: Baisakh, Jestha, Ashadh, Shrawan, Bhadra, Ashwin, Kartik,
Mangsir, Poush, Magh, Falgun, Chaitra.

---

## 6. Layout

```css
--space: 4px base;  4 8 12 16 24 32 48 64 96
--radius-sm: 3px;   --radius: 6px;   --radius-lg: 10px;
```

Radii stay small. This is a document, not a consumer app.

```css
--shadow-sm: 0 1px 2px #14191c0d;
--shadow: 0 2px 8px #14191c14;
```

Shadows only to lift a card off paper. No glows, no coloured shadows, no
gradients anywhere.

Widths: public content 1200px, prose 68ch, admin full-width with a 240px
sidebar, **checkout 420px single column**.

Breakpoints: 640 / 768 / 1024 / 1280. Mobile-first — a large share of customers
pay on a phone.

---

## 7. Surface-specific direction

### Public site

Generous space, one accent, restraint. The hero opens with what the company
actually does, in plain words — not a gradient and a big number.

The ledger motif appears once, where it is true: the pricing block is set as a
receipt with banded rows. That is the connection between the marketing promise
and the product.

### Admin

Dense and data-first. Numbers are the interface. Tables use the full band
treatment. Sidebar navigation, breadcrumbs, no marketing tone anywhere.

Money uses colour semantically throughout: `--credit` for received, `--flag`
for refunded or reversed, `--foreground` for neutral.

### Checkout — different rules apply

**A payment page must feel boring and certain.** Anything surprising reads as
untrustworthy at exactly the wrong moment.

- Single 420px column, centred, nothing else on the page
- No animation beyond a loading state. No hover flourish. No motion on load.
- Company mark, then a receipt block: product, invoice number, amount
- Payment method buttons, full width, stacked, minimum 48px tall
- Amount is the largest thing on the page — `--text-2xl`, mono, tabular
- Nothing marketing. No upsell. No "you're going to love it."
- Expiry stated plainly: _This payment link expires at 11:00._
- Works on a slow 3G connection: no heavy fonts blocking render, no large images

### Client portal

Between the two. Calmer than admin, more structured than marketing. Project
stages as a genuine sequence — numbered markers are appropriate here because
the order carries information a client needs.

---

## 8. Components

`shadcn/ui` as the base, restyled to these tokens. Do not ship default shadcn
appearance.

**Buttons.** Primary `--primary` with `--primary-foreground` text. Secondary
`--border` outline on `--surface-strong`. Destructive `--destructive`. Ghost for
tertiary. Terracotta `--accent-strong` is for emphasis, not a third button
variant. 40px tall, 48px on touch.

**Forms.** Label above input, always visible — never placeholder-as-label.
1px `--input` border, `--ring` on focus. Error text `--destructive` below the
field, naming the problem and the fix.

**Status.** Small caps, `--text-xs`, 3px radius, tinted background:

| Status                        | Colour               |
| ----------------------------- | -------------------- |
| succeeded, active, reconciled | `--credit`           |
| pending, created, polling     | `--foreground`       |
| failed, cancelled, expired    | `--muted-foreground` |
| refunded, reversed, mismatch  | `--flag`             |

**Empty states.** A sentence describing what will appear here, and the action
that creates the first one. Never an illustration, never "Nothing here yet!"

---

## 9. Writing

Words are design material. Same care as spacing.

- **Name things as the founder does**, not as the system does. "Payment methods,"
  not "provider configuration." "Who can use this key," not "scope array."
- **Active voice, exact actions.** "Approve payment," not "Submit." The button
  that says _Approve payment_ produces a toast that says _Payment approved._
- **Errors state what happened and what to do.** No apology, no vagueness.
  - ✓ _This payment link expired. Ask HostelHub for a new one._
  - ✗ _Sorry, something went wrong!_
- **Sentence case everywhere** except the small-caps table headers and eyebrows.
- **Be specific over clever.** "Reconcile against eSewa" beats "Sync your money."
- One job per element. A label labels. An example demonstrates. Nothing does
  double duty.

---

## 10. Quality floor

Not negotiable, not announced:

- Responsive to 360px
- Visible keyboard focus on every interactive element — never `outline: none`
  without a replacement
- `prefers-reduced-motion` respected; all motion becomes instant
- WCAG 2.1 AA contrast. Verify `--accent-strong` on `--surface-strong`, and
  `--credit` and `--flag` on `--muted`, specifically — the banded rows are where
  a marginal contrast ratio actually bites.
- Touch targets ≥ 44px
- Semantic HTML; tables are `<table>`, not divs — screen readers need the
  row/column relationship the band communicates visually
- Fonts: `font-display: swap`, subset, preloaded
- Lighthouse ≥ 95 performance and accessibility on public pages

---

## 11. Before adding anything visual

Ask: does this help someone understand or act? If it is there to look
finished, remove it.

The banded data table is the one bold move. Everything around it stays
disciplined.
