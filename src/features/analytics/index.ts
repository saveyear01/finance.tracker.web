/**
 * Public surface of the analytics feature — the Analytics page: expenses
 * and income grouped by note and charted. It only reads the ledger; nothing
 * outside `features/analytics` should import from its subfolders directly.
 */
export { AnalyticsOverview } from './components/analytics-overview'
export { NoteDays } from './components/note-days'
export { analyticsKeys } from './api/analytics-keys'
export { kindFromParams } from './lib/kinds'
