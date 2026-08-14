/**
 * Chart of accounts — docs/CHART_OF_ACCOUNTS.md §§2–7, verbatim.
 *
 * Header accounts (marked ▸ in the doc) are `isPostable: false` and exist only
 * for report grouping. Contra accounts carry the flipped normal balance so
 * `v_trial_balance.balance_minor` signs correctly.
 *
 * Adding a leaf account later is a row insert. Never edit posted history.
 */
import type { accounts } from '../schema/accounts';

type AccountSeed = typeof accounts.$inferInsert;

const header = (
  code: string,
  name: string,
  cls: AccountSeed['class'],
  normal: AccountSeed['normalBalance'],
  parentCode?: string,
): AccountSeed => ({
  code,
  name,
  class: cls,
  normalBalance: normal,
  isPostable: false,
  ...(parentCode ? { parentCode } : {}),
});

const leaf = (
  code: string,
  name: string,
  cls: AccountSeed['class'],
  normal: AccountSeed['normalBalance'],
  parentCode: string | undefined,
  extra: Partial<AccountSeed> = {},
): AccountSeed => ({
  code,
  name,
  class: cls,
  normalBalance: normal,
  isPostable: true,
  ...(parentCode ? { parentCode } : {}),
  ...extra,
});

export const accountSeeds: AccountSeed[] = [
  // ── 2. Assets ─────────────────────────────────────────────────────────────
  header('1000', 'CURRENT ASSETS', 'asset', 'debit'),
  leaf('1010', 'Cash in Hand', 'asset', 'debit', '1000'),
  // The bank's name is an open question in docs/MEMORY.md — the label is
  // generic until the founder answers.
  leaf('1020', 'Bank — Current Account', 'asset', 'debit', '1000', {
    reconcileSource: 'bank_statement',
  }),
  leaf('1021', 'Bank — Savings Account', 'asset', 'debit', '1000'),

  header('1030', 'PAYMENT PROVIDER BALANCES', 'asset', 'debit'),
  leaf('1031', 'eSewa Merchant Wallet', 'asset', 'debit', '1030', {
    reconcileSource: 'esewa',
  }),
  leaf('1032', 'Khalti Merchant Wallet', 'asset', 'debit', '1030', {
    reconcileSource: 'khalti',
  }),
  leaf('1033', 'Fonepay Settlement Account', 'asset', 'debit', '1030', {
    reconcileSource: 'fonepay',
  }),
  leaf('1039', 'Provider Funds in Transit', 'asset', 'debit', '1030'),

  header('1100', 'RECEIVABLES', 'asset', 'debit'),
  leaf(
    '1110',
    'Accounts Receivable — SaaS Subscriptions',
    'asset',
    'debit',
    '1100',
  ),
  leaf(
    '1120',
    'Accounts Receivable — Projects & Agency',
    'asset',
    'debit',
    '1100',
  ),
  leaf(
    '1130',
    'Accounts Receivable — Maintenance & Support',
    'asset',
    'debit',
    '1100',
  ),
  leaf('1190', 'Allowance for Doubtful Accounts', 'asset', 'credit', '1100', {
    isContra: true,
  }),

  header('1200', 'OTHER CURRENT ASSETS', 'asset', 'debit'),
  leaf(
    '1210',
    'Advance Tax — TDS Deducted by Customers',
    'asset',
    'debit',
    '1200',
  ),
  leaf('1220', 'Prepaid Expenses', 'asset', 'debit', '1200'),
  leaf('1230', 'Security Deposits', 'asset', 'debit', '1200'),
  leaf('1240', 'Staff Advances', 'asset', 'debit', '1200'),

  header('1500', 'FIXED ASSETS', 'asset', 'debit'),
  leaf('1510', 'Computers & Equipment', 'asset', 'debit', '1500'),
  leaf('1520', 'Furniture & Fixtures', 'asset', 'debit', '1500'),
  leaf('1530', 'Software Licenses (capitalised)', 'asset', 'debit', '1500'),
  leaf('1590', 'Accumulated Depreciation', 'asset', 'credit', '1500', {
    isContra: true,
  }),

  // ── 3. Liabilities ────────────────────────────────────────────────────────
  header('2000', 'CURRENT LIABILITIES', 'liability', 'credit'),
  leaf('2010', 'Accounts Payable — Trade', 'liability', 'credit', '2000'),
  leaf('2020', 'Accrued Expenses', 'liability', 'credit', '2000'),
  leaf('2030', 'Salaries Payable', 'liability', 'credit', '2000'),

  header('2040', 'STATUTORY PAYABLES', 'liability', 'credit'),
  leaf('2041', 'TDS Payable — Salary', 'liability', 'credit', '2040'),
  leaf(
    '2042',
    'TDS Payable — Contractor / Professional',
    'liability',
    'credit',
    '2040',
  ),
  leaf('2043', 'TDS Payable — Rent', 'liability', 'credit', '2040'),
  leaf('2044', 'SSF / Provident Fund Payable', 'liability', 'credit', '2040'),
  leaf('2050', 'Income Tax Payable', 'liability', 'credit', '2040'),

  header('2100', 'CUSTOMER OBLIGATIONS', 'liability', 'credit'),
  leaf(
    '2110',
    'Deferred Revenue — Subscriptions',
    'liability',
    'credit',
    '2100',
  ),
  leaf(
    '2120',
    'Customer Advances / Unapplied Receipts',
    'liability',
    'credit',
    '2100',
  ),
  leaf('2130', 'Refunds Payable', 'liability', 'credit', '2100'),
  leaf('2140', 'Chargeback / Dispute Reserve', 'liability', 'credit', '2100'),

  header('2200', 'OTHER', 'liability', 'credit'),
  leaf('2210', 'Loans Payable — Short Term', 'liability', 'credit', '2200'),
  leaf('2220', "Director's Loan", 'liability', 'credit', '2200'),

  // ── 4. Equity ─────────────────────────────────────────────────────────────
  leaf('3010', 'Share Capital', 'equity', 'credit', undefined),
  leaf('3020', 'Additional Paid-in Capital', 'equity', 'credit', undefined),
  leaf('3100', 'Retained Earnings', 'equity', 'credit', undefined),
  // System-maintained: computed at close, never posted to directly.
  header('3900', 'Current Year Earnings', 'equity', 'credit'),

  // ── 5. Revenue ────────────────────────────────────────────────────────────
  // Revenue is not split per product — `product_id` on the ledger line is.
  leaf('4010', 'SaaS Subscription Revenue', 'revenue', 'credit', undefined),
  leaf('4020', 'Software Development Revenue', 'revenue', 'credit', undefined),
  leaf(
    '4030',
    'Website & Design Services Revenue',
    'revenue',
    'credit',
    undefined,
  ),
  leaf('4040', 'Maintenance & Support Revenue', 'revenue', 'credit', undefined),
  leaf('4050', 'Setup / Onboarding Fees', 'revenue', 'credit', undefined),
  leaf('4090', 'Other Income', 'revenue', 'credit', undefined),
  leaf('4900', 'Refunds & Sales Returns', 'revenue', 'debit', undefined, {
    isContra: true,
  }),
  leaf('4910', 'Discounts Allowed', 'revenue', 'debit', undefined, {
    isContra: true,
  }),

  // ── 6. Direct costs ───────────────────────────────────────────────────────
  leaf('5010', 'Payment Provider Fees', 'direct_cost', 'debit', undefined),
  leaf('5020', 'Hosting & Infrastructure', 'direct_cost', 'debit', undefined),
  leaf(
    '5030',
    'Third-party Software & API Costs',
    'direct_cost',
    'debit',
    undefined,
  ),
  leaf(
    '5040',
    'Subcontractor & Freelancer Costs',
    'direct_cost',
    'debit',
    undefined,
  ),
  leaf(
    '5050',
    'Domains, SSL & Registrations',
    'direct_cost',
    'debit',
    undefined,
  ),
  leaf('5060', 'Bank Charges — Merchant', 'direct_cost', 'debit', undefined),

  // ── 7. Operating expenses ─────────────────────────────────────────────────
  leaf('6010', 'Salaries & Wages', 'expense', 'debit', undefined),
  leaf('6020', 'Staff Benefits & Welfare', 'expense', 'debit', undefined),
  leaf('6030', 'Office Rent', 'expense', 'debit', undefined),
  leaf('6040', 'Electricity & Utilities', 'expense', 'debit', undefined),
  leaf('6050', 'Internet & Communication', 'expense', 'debit', undefined),
  leaf('6060', 'Marketing & Advertising', 'expense', 'debit', undefined),
  leaf('6070', 'Professional Fees', 'expense', 'debit', undefined),
  leaf('6080', 'Bank Charges — General', 'expense', 'debit', undefined),
  leaf('6090', 'Travel & Transport', 'expense', 'debit', undefined),
  leaf('6100', 'Office Supplies & Consumables', 'expense', 'debit', undefined),
  leaf('6110', 'Depreciation', 'expense', 'debit', undefined),
  leaf('6120', 'Repairs & Maintenance', 'expense', 'debit', undefined),
  leaf('6130', 'Training & Development', 'expense', 'debit', undefined),
  leaf('6140', 'Insurance', 'expense', 'debit', undefined),
  leaf('6200', 'Foreign Exchange Gain / Loss', 'expense', 'debit', undefined),
  leaf('6900', 'Miscellaneous Expenses', 'expense', 'debit', undefined),
];
