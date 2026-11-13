import { localToday } from '@/features/transactions'

import { currentAndNextMonth, isOwed, summarize } from '../lib/upcoming-meta'
import type { Occurrence } from '../types'
import { useDue } from './use-upcoming'

/**
 * What is owed right now: this month's unpaid due dates plus any earlier
 * ones still owed, soonest first — the nav's overdue badge and the "Pay
 * something due" list of the new-entry sheet.
 *
 * The same query as Upcoming's first tab and Home's Due this month
 * (`carryOverdue` on the current month), so it costs no extra request once
 * either has loaded.
 */
export function useDueNow(): { owed: Occurrence[]; overdue: number; today: string } {
  const today = localToday()
  const { current } = currentAndNextMonth()
  const { occurrences } = useDue(current, { carryOverdue: true })
  const owed = occurrences
    .filter(isOwed)
    .sort((a, b) => a.due_date.localeCompare(b.due_date))
  return { owed, overdue: summarize(occurrences, today).overdue, today }
}
