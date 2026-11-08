/**
 * Public surface of the spending feature — the Analytics page: where the
 * money went, grouped by note and charted. It only reads the ledger; nothing
 * outside `features/spending` should import from its subfolders directly.
 */
export { NoteSpending } from './components/note-spending'
export { SpendingOverview } from './components/spending-overview'
export { spendingKeys } from './api/spending-keys'
