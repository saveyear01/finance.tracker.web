import { yearOf } from '../lib/ranges'
import type { Kind } from '../types'
import { useSummary } from './use-analytics'

/**
 * Whether the household has EVER recorded an expense, or an income — what
 * Home's setup checklist ticks "Record your first income" off by.
 *
 * Read off this year's summary rather than a new endpoint: its total covers
 * the year, and `last_before` names the newest day with any before it, so
 * the two together say "ever" (a year to come aside). It counts exactly
 * what Analytics counts — income and its split legs, never adjustments, so
 * an opening balance isn't mistaken for income. The same key as the
 * Analytics year view, so neither fetches it twice.
 *
 * `null` while it is still loading (or failed), so a caller can wait rather
 * than flash a checklist at a household that is long set up.
 */
export function useEverRecorded(kind: Kind, enabled = true): boolean | null {
  const summary = useSummary(kind, yearOf(new Date()).window, enabled)
  if (!summary.data) return null
  return Number(summary.data.total) !== 0 || summary.data.last_before !== null
}
