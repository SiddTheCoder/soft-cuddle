/** Typed errors, not strings. docs/RULES.md §5. */
export class AccountingError extends Error {
  constructor(
    readonly code:
      | 'NO_FISCAL_PERIOD'
      | 'PERIOD_NOT_OPEN'
      | 'UNBALANCED_JOURNAL'
      | 'EMPTY_JOURNAL'
      | 'INVALID_AMOUNT'
      | 'DUPLICATE_LINE_NO',
    message: string,
    readonly context?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'AccountingError';
  }
}
