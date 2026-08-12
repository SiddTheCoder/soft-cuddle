// packages/accounting — no `next` import, never imports payment-core.
export { postJournal } from './post-journal';
export type {
  JournalLineInput,
  PostJournalInput,
  PostedJournal,
} from './post-journal';
export { resolveFiscalPeriod } from './periods/resolve';
export {
  allocateDocumentNo,
  allocateSequence,
  formatDocumentNo,
} from './numbering';
export type { SequenceKind } from './numbering';
export { AccountingError } from './errors';
