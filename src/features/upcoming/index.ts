/**
 * Public surface of the upcoming-expenses feature — bills you know are
 * coming, and paying them. Nothing outside `features/upcoming` should import
 * from its subfolders directly.
 *
 * Dependencies run one way: upcoming uses wallets, funds and transactions;
 * none of them imports anything from here.
 */
export { DeleteUpcomingDrawer } from './components/delete-upcoming-drawer'
export { PayDrawer } from './components/pay-drawer'
export { UpcomingDrawer } from './components/upcoming-drawer'
export { UpcomingSummary } from './components/upcoming-summary'
export { UpcomingTabs } from './components/upcoming-tabs'
export { upcomingKeys } from './api/upcoming-keys'
export type { Occurrence, UpcomingExpense } from './types'
