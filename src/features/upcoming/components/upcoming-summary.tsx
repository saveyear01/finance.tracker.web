import { CalendarClock, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

import { localToday } from '@/features/transactions'
import { formatMoney } from '@/lib/money'

import { useDue } from '../hooks/use-upcoming'
import { currentAndNextMonth, summarize } from '../lib/upcoming-meta'

/**
 * Home's way in to Upcoming: what's still to pay this month (overdue bills
 * included), as one tappable row. The same query as the page's first tab,
 * so opening the page shows it at once.
 */
export function UpcomingSummary() {
  const { current } = currentAndNextMonth()
  const { occurrences, isLoading } = useDue(current, { carryOverdue: true })
  const { toPayCents, unpaid, overdue } = summarize(occurrences, localToday())

  const detail = isLoading
    ? 'Loading…'
    : unpaid > 0
      ? `${unpaid} to pay this month`
      : occurrences.length > 0
        ? 'All paid this month'
        : 'Nothing due this month'

  return (
    <Link
      to="/upcoming"
      className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 text-card-foreground transition-colors outline-none hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-muted">
        <CalendarClock className="size-4 text-muted-foreground" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium">Upcoming expenses</span>
        <span className="block truncate text-xs text-muted-foreground">
          {detail}
          {overdue > 0 && <span className="font-medium text-destructive"> · {overdue} overdue</span>}
        </span>
      </span>
      {unpaid > 0 && (
        <span className="shrink-0 font-semibold tabular-nums">{formatMoney(toPayCents / 100)}</span>
      )}
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
    </Link>
  )
}
