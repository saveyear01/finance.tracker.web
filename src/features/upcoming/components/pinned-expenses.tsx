import { Pin } from 'lucide-react'

import { EmptyState } from '@/components/layouts/empty-state'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { localToday } from '@/features/transactions'
import { getApiErrorMessage } from '@/lib/api-client'

import { usePinned } from '../hooks/use-upcoming'
import { currentAndNextMonth } from '../lib/upcoming-meta'
import { UpcomingRow } from './upcoming-row'

/**
 * Home's pinned expenses: the bills the household pinned for quick access,
 * as they stand THIS month — the Upcoming page's current-month tab cut down
 * to pinned bills (decided 2026-09-24). So a paid recurring bill stays in
 * view, paid, until the month is over rather than jumping ahead to next
 * month's date; overdue ones carry in, late being still this month's
 * business; and a pin due in a later month waits for its month. The month
 * is the user's own, sent to the API.
 *
 * The same rows as the month tabs, so a bill reads the same on Home as on
 * Upcoming, and each opens that due date's own page, where Pay is one tap
 * away. A list stays a list: no buttons in the rows.
 *
 * Skipped due dates go in a section of their own at the bottom (decided
 * 2026-09-24): they aren't owed, so they shouldn't sit among what is — but
 * a skip made this month stays in view with its undo, as on the Upcoming
 * page's current-month tab.
 *
 * Pinning happens on the bill's page; this list only shows the result, and
 * says where to go when nothing is pinned yet.
 */
export function PinnedExpenses() {
  const { occurrences, isLoading, isError, error } = usePinned(currentAndNextMonth().current)
  const today = localToday()

  if (isLoading) {
    return <div className="h-48 animate-pulse rounded-xl bg-muted" aria-hidden="true" />
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {getApiErrorMessage(error, 'Could not load your pinned expenses.')}
        </AlertDescription>
      </Alert>
    )
  }

  if (occurrences.length === 0) {
    return (
      <EmptyState
        icon={Pin}
        title="Nothing pinned this month"
        description="Open an upcoming expense and pin it, and it shows up here in the months it's due."
      />
    )
  }

  const skipped = occurrences.filter((occurrence) => occurrence.status === 'skipped')
  const rest = occurrences.filter((occurrence) => occurrence.status !== 'skipped')

  return (
    <div className="space-y-2">
      {rest.length > 0 ? (
        <ul className="space-y-2">
          {rest.map((occurrence) => (
            <UpcomingRow
              key={`${occurrence.expense.id}:${occurrence.due_date}`}
              occurrence={occurrence}
              today={today}
            />
          ))}
        </ul>
      ) : (
        <p className="py-2 text-center text-sm text-muted-foreground">
          Everything pinned this month is skipped.
        </p>
      )}

      {skipped.length > 0 && (
        <section className="space-y-2 pt-2">
          <h3 className="text-sm font-semibold text-muted-foreground">
            Skipped · {skipped.length}
          </h3>
          <ul className="space-y-2">
            {skipped.map((occurrence) => (
              <UpcomingRow
                key={`${occurrence.expense.id}:${occurrence.due_date}`}
                occurrence={occurrence}
                today={today}
              />
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
