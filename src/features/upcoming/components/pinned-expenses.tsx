import { Pin } from 'lucide-react'

import { EmptyState } from '@/components/layouts/empty-state'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { localToday } from '@/features/transactions'
import { getApiErrorMessage } from '@/lib/api-client'

import { usePinned } from '../hooks/use-upcoming'
import { UpcomingRow } from './upcoming-row'

/**
 * Home's pinned expenses: the bills the household pinned for quick access,
 * each as the due date to pay next — soonest first, so what's due next (or
 * already late) is at the top.
 *
 * The same rows as the month tabs, so a bill reads the same on Home as on
 * Upcoming, and each opens that due date's own page, where Pay is one tap
 * away. A list stays a list: no buttons in the rows.
 *
 * Pinning happens on the bill's page; this list only shows the result, and
 * says where to go when nothing is pinned yet.
 */
export function PinnedExpenses() {
  const { occurrences, isLoading, isError, error } = usePinned()
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
        title="Nothing pinned yet"
        description="Open an upcoming expense and pin it, and it stays here for quick access."
      />
    )
  }

  return (
    <ul className="space-y-2">
      {occurrences.map((occurrence) => (
        <UpcomingRow
          key={`${occurrence.expense.id}:${occurrence.due_date}`}
          occurrence={occurrence}
          today={today}
        />
      ))}
    </ul>
  )
}
