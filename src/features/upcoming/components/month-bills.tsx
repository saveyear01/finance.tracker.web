import { CalendarCheck } from 'lucide-react'

import { AddCard } from '@/components/add-card'
import { EmptyState } from '@/components/layouts/empty-state'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { localToday } from '@/features/transactions'
import { getApiErrorMessage } from '@/lib/api-client'
import { formatMoney } from '@/lib/money'

import { useDue } from '../hooks/use-upcoming'
import { monthName, summarize } from '../lib/upcoming-meta'
import { UpcomingRow } from './upcoming-row'

/**
 * A window's bills: what's left to pay and what's been paid, then every due
 * date in it, soonest first.
 *
 * Usually one month. With `through` it spans several — the later tab — and
 * with `excludeMonthly` the bills that repeat every month are left out of
 * it, since over a long window they would crowd out the one-offs that are
 * the reason to look ahead. That omission is said out loud above the list:
 * a tab that quietly drops your rent is worse than one that has none.
 *
 * The current month also carries overdue bills from before it
 * (`carryOverdue`), at the top.
 *
 * Paid due dates sit in a section of their own under the rest, and skipped
 * ones in another below that (decided 2026-09-24): what still needs doing
 * reads as one list, and what's done — or waved off — doesn't pad it out.
 * A skip made this month stays here with its undo on the bill's page.
 *
 * Rows are links: paying, skipping, editing and deleting all live on the due
 * date's own page, so nothing here needs handlers for them.
 */
export function MonthBills({
  month,
  through,
  carryOverdue = false,
  excludeMonthly = false,
  onAdd,
}: {
  /** YYYY-MM — the window's first month. */
  month: string
  /** YYYY-MM — its last, when the window is more than one month. */
  through?: string
  carryOverdue?: boolean
  excludeMonthly?: boolean
  onAdd: () => void
}) {
  const { occurrences, isLoading, isError, error } = useDue(month, {
    through,
    carryOverdue,
    excludeMonthly,
  })
  const today = localToday()

  if (isLoading) {
    return <div className="h-48 animate-pulse rounded-xl bg-muted" aria-hidden="true" />
  }
  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {getApiErrorMessage(error, 'Could not load your upcoming expenses.')}
        </AlertDescription>
      </Alert>
    )
  }
  const add = <AddCard label="Add new upcoming expense" onClick={onAdd} />

  // A window ending before it starts is a real answer, not a bug: from
  // November, "after next month" is already next year, which this tab
  // deliberately stops short of.
  const spansYear = through !== undefined
  const emptyTitle = spansYear
    ? `Nothing else due in ${month.slice(0, 4)}`
    : `Nothing due in ${monthName(month)}`

  if (occurrences.length === 0) {
    return (
      <div className="space-y-3">
        {add}
        <EmptyState
          icon={CalendarCheck}
          title={emptyTitle}
          description={
            excludeMonthly
              ? "One-off and yearly bills due later this year show up here. The ones that repeat every month stay on their own tabs."
              : "Add the bills you know are coming — rent, internet, insurance — and they show up in the month they're due."
          }
        />
      </div>
    )
  }

  const { toPayCents, paidCents, unpaid, overdue } = summarize(occurrences, today)
  const paid = occurrences.filter((occurrence) => occurrence.status === 'paid')
  const skipped = occurrences.filter((occurrence) => occurrence.status === 'skipped')
  const open = occurrences.filter(
    (occurrence) => occurrence.status !== 'paid' && occurrence.status !== 'skipped',
  )

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-card p-3">
          <p className="text-xs text-muted-foreground">
            To pay{unpaid > 0 && ` · ${unpaid}`}
            {overdue > 0 && <span className="text-destructive"> · {overdue} overdue</span>}
          </p>
          <p className="text-lg font-semibold tabular-nums">{formatMoney(toPayCents / 100)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <p className="text-xs text-muted-foreground">Paid</p>
          <p className="text-lg font-semibold text-success tabular-nums">
            {formatMoney(paidCents / 100)}
          </p>
        </div>
      </div>

      {excludeMonthly && (
        <p className="text-xs text-muted-foreground">
          One-off and yearly bills only — the ones that repeat every month are on the month tabs.
        </p>
      )}

      {add}
      {open.length > 0 ? (
        <ul className="space-y-2">
          {open.map((occurrence) => (
            <UpcomingRow
              key={`${occurrence.expense.id}:${occurrence.due_date}`}
              occurrence={occurrence}
              today={today}
            />
          ))}
        </ul>
      ) : (
        <p className="py-2 text-center text-sm text-muted-foreground">
          {paid.length > 0 ? 'Everything here is paid.' : 'Nothing left to pay here.'}
        </p>
      )}

      {paid.length > 0 && (
        <section className="space-y-2 pt-2">
          <h2 className="font-semibold">Paid · {paid.length}</h2>
          <ul className="space-y-2">
            {paid.map((occurrence) => (
              <UpcomingRow
                key={`${occurrence.expense.id}:${occurrence.due_date}`}
                occurrence={occurrence}
                today={today}
              />
            ))}
          </ul>
        </section>
      )}

      {skipped.length > 0 && (
        <section className="space-y-2 pt-2">
          <h2 className="font-semibold">Skipped · {skipped.length}</h2>
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
