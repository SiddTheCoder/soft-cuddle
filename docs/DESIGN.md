# Design

> **This is a proposal.** We hadn't discussed visuals, so this direction is
> derived from what the product actually is. The founder should review and
> change anything. Once approved, follow it exactly — do not substitute
> defaults mid-build.

---

## 1. Direction: the ledger

Softmato's real subject is not "startup software company." It is **a
well-kept account book**. The whole platform exists to record money correctly:
debits and credits, ruled columns, entries that cannot be erased, corrections
made in the margin rather than by rubbing out.

So the design comes from accounting stationery — specifically **greenbar
paper**, the continuous-feed accounting stock with alternating pale green bands
that let your eye track a row across a wide table. That band is the signature
element. It is functional first: it genuinely helps a founder read a transaction
row across eight columns. It also ties every surface together — the same band
appears in an admin ledger table, on the checkout receipt, and in the pricing
block on the marketing site.

Everything else stays quiet. One signature, executed precisely.

**What this deliberately is not:** not the cream-and-serif-and-terracotta look,
not black-with-an-acid-accent, not newspaper broadsheet. Hairline rules appear
here as *column* rules on ruled paper, always paired with the green band — the
reference is a bill book, not a front page.

---

## 2. Palette

Six values. Nothing else without asking.

```css
--ink:     #14191C;   /* fountain-pen near-black, cool cast — text, headings */
--paper:   #FAFAF8;   /* base surface */
--bar:     #E6EDE7;   /* greenbar band — the signature */
--rule:    #C5CEC6;   /* hairline column rules, borders */
--tomato:  #C9321F;   /* brand, primary action */
--credit:  #1B6B4A;   /* money in, positive, success */
--flag:    #A81E12;   /* corrections, reversals, negative amounts, danger */
```

Derived neutrals only, no new hues:

```css
--ink-70:  #14191CB3;   /* secondary text */
--ink-45:  #14191C73;   /* tertiary, captions */
--surface: #FFFFFF;     /* cards lifted off paper */
```

**Colour carries meaning in this product.** `--credit` and `--flag` are not
decoration — green means money in, red means money out or something reversed.
Never use either for emphasis on non-financial text. Never use `--tomato` for a
number.

Dark mode: admin only, deferred to Phase 7. Public and checkout are light only.

---

## 3. Typography

Three roles, three faces.

| Role | Face | Source | Use |
|---|---|---|---|
| Display | **Bespoke Slab** | Fontshare | Headings, page titles. Restraint. |
| Body | **Switzer** | Fontshare | All running text, UI labels, buttons |
| Data | **IBM Plex Mono** | Google | Every number, ID, code, amount |
| Devanagari | **Noto Sans Devanagari** | Google | Fallback for Nepali text |

Bespoke Slab reads as stamped and official — the register of a printed receipt
or a rubber-stamped document. It is used sparingly: page titles and section
heads only. Switzer stays out of the way. Plex Mono exists for one reason, and
it is the important one:

**Every number in this product is set in tabular mono.**

```css
font-variant-numeric: tabular-nums;
```

Amounts, transaction IDs, invoice numbers, account codes, dates. Digits must
align vertically in a column so a mis-keyed figure is visible at a glance. This
is not aesthetic preference — it is how you catch a NPR 50,000 that should have
been NPR 5,000.

### Scale

```css
--text-xs:   0.75rem  / 1.4    /* captions, table meta */
--text-sm:   0.875rem / 1.5    /* secondary, dense tables */
--text-base: 1rem     / 1.6    /* body */
--text-lg:   1.125rem / 1.5    /* lead paragraph */
--text-xl:   1.5rem   / 1.3    /* section head */
--text-2xl:  2rem     / 1.2    /* page title */
--text-3xl:  3rem     / 1.1    /* hero, public only */
```

Weights: 400 body, 500 UI labels, 600 display. Never 700+ — the slab is heavy
enough. Never faux-bold a mono figure.

Tracking: display `-0.02em`. Body 0. Mono 0. All-caps eyebrows `0.08em`, and
eyebrows appear only where they label a real section, never as decoration.

---

## 4. The signature: greenbar tables

The one thing this product is remembered by.

```
┌──────────────────────────────────────────────────────────────┐
│ DATE        TXN                PRODUCT     METHOD      AMOUNT│  ← ink, caps, xs
├──────────────────────────────────────────────────────────────┤
│ 12 Bhadra   TXN-2082/83-00041  HostelHub   Khalti   12,000.00│  ← paper
│ 12 Bhadra   TXN-2082/83-00042  QuestionCa… eSewa     2,500.00│  ← bar
│ 11 Bhadra   TXN-2082/83-00043  HostelHub   Manual   45,000.00│  ← paper
│ 11 Bhadra   TXN-2082/83-00044  HostelHub   Khalti  −3,000.00 │  ← bar, flag
└──────────────────────────────────────────────────────────────┘
```

Rules:

- Odd rows `--paper`, even rows `--bar`. Never a hover-only stripe — the band
  is structural, always visible.
- Column rules are 1px `--rule`, vertical only between numeric columns where
  alignment matters. No full grid.
- Header row: `--ink`, `--text-xs`, uppercase, `0.08em` tracking, 1px bottom
  rule.
- **Every amount column is right-aligned, mono, tabular.** No exceptions.
- Negative amounts get `--flag` and a true minus sign `−` (U+2212), not a
  hyphen.
- Row height 40px desktop, 48px touch.
- No zebra *and* border — the band replaces the border.

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
  const negative = minor < 0n
  const abs = negative ? -minor : minor
  const rupees = abs / 100n
  const paisa  = abs % 100n

  const s = rupees.toString()
  // last three digits, then pairs
  const head = s.slice(0, -3)
  const tail = s.slice(-3)
  const grouped = head
    ? head.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + tail
    : tail

  const body = `${grouped}.${paisa.toString().padStart(2, '0')}`
  return `${negative ? '−' : ''}${opts?.symbol === false ? '' : 'NPR '}${body}`
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
--shadow-sm: 0 1px 2px #14191C0D;
--shadow:    0 2px 8px #14191C14;
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
receipt with greenbar rows. That is the connection between the marketing promise
and the product.

### Admin

Dense and data-first. Numbers are the interface. Tables use the full band
treatment. Sidebar navigation, breadcrumbs, no marketing tone anywhere.

Money uses colour semantically throughout: `--credit` for received, `--flag`
for refunded or reversed, `--ink` for neutral.

### Checkout — different rules apply

**A payment page must feel boring and certain.** Anything surprising reads as
untrustworthy at exactly the wrong moment.

- Single 420px column, centred, nothing else on the page
- No animation beyond a loading state. No hover flourish. No motion on load.
- Company mark, then a receipt block: product, invoice number, amount
- Payment method buttons, full width, stacked, minimum 48px tall
- Amount is the largest thing on the page — `--text-2xl`, mono, tabular
- Nothing marketing. No upsell. No "you're going to love it."
- Expiry stated plainly: *This payment link expires at 11:00.*
- Works on a slow 3G connection: no heavy fonts blocking render, no large images

### Client portal

Between the two. Calmer than admin, more structured than marketing. Project
stages as a genuine sequence — numbered markers are appropriate here because
the order carries information a client needs.

---

## 8. Components

`shadcn/ui` as the base, restyled to these tokens. Do not ship default shadcn
appearance.

**Buttons.** Primary `--tomato` on white text. Secondary `--ink` outline on
paper. Destructive `--flag`. Ghost for tertiary. 40px tall, 48px on touch.

**Forms.** Label above input, always visible — never placeholder-as-label.
1px `--rule` border, 2px `--ink` on focus. Error text `--flag` below the field,
naming the problem and the fix.

**Status.** Small caps, `--text-xs`, 3px radius, tinted background:

| Status | Colour |
|---|---|
| succeeded, active, reconciled | `--credit` |
| pending, created, polling | `--ink-70` |
| failed, cancelled, expired | `--ink-45` |
| refunded, reversed, mismatch | `--flag` |

**Empty states.** A sentence describing what will appear here, and the action
that creates the first one. Never an illustration, never "Nothing here yet!"

---

## 9. Writing

Words are design material. Same care as spacing.

- **Name things as the founder does**, not as the system does. "Payment methods,"
  not "provider configuration." "Who can use this key," not "scope array."
- **Active voice, exact actions.** "Approve payment," not "Submit." The button
  that says *Approve payment* produces a toast that says *Payment approved.*
- **Errors state what happened and what to do.** No apology, no vagueness.
  - ✓ *This payment link expired. Ask HostelHub for a new one.*
  - ✗ *Sorry, something went wrong!*
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
- WCAG 2.1 AA contrast. Verify `--tomato` on `--paper` and `--credit` on
  `--bar` specifically.
- Touch targets ≥ 44px
- Semantic HTML; tables are `<table>`, not divs — screen readers need the
  row/column relationship the greenbar communicates visually
- Fonts: `font-display: swap`, subset, preloaded
- Lighthouse ≥ 95 performance and accessibility on public pages

---

## 11. Before adding anything visual

Ask: does this help someone understand or act? If it is there to look
finished, remove it.

The greenbar band is the one bold move. Everything around it stays disciplined.
