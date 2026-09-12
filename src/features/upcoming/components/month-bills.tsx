import { CalendarCheck } from 'lucide-react'
import { toast } from 'sonner'

import { AddCard } from '@/components/add-card'
import { EmptyState } from '@/components/layouts/empty-state'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { localToday } from '@/features/transactions'
import { getApiErrorMessage } from '@/lib/api-client'
import { formatMoney } from '@/lib/money'

import { useDue, useSkipUpcoming, useUndoSkip } from '../hooks/use-upcoming'
import { monthName, summarize } from '../lib/upcoming-meta'
import type { Occurrence, UpcomingExpense } from '../types'
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
 */
export function MonthBills({
  month,
  through,
  carryOverdue = false,
  excludeMonthly = false,
  onAdd,
  onPay,
  onEdit,
  onDelete,
}: {
  /** YYYY-MM — the window's first month. */
  month: string
  /** YYYY-MM — its last, when the window is more than one month. */
  through?: string
  carryOverdue?: boolean
  excludeMonthly?: boolean
  onAdd: () => void
  onPay: (occurrence: Occurrence) => void
  onEdit: (expense: UpcomingExpense) => void
  onDelete: (expense: UpcomingExpense) => void
}) {
  const { occurrences, isLoading, isError, error } = useDue(month, {
    through,
    carryOverdue,
    excludeMonthly,
  })
  const skip = useSkipUpcoming()
  const undo = useUndoSkip()
  const today = localToday()

  // No confirmation — a skip is one tap to undo, from the toast or the menu.
  const undoSkip = ({ expense, due_date }: Occurrence) =>
    undo.mutate(
      { id: expense.id, dueDate: due_date },
      {
        onSuccess: () => toast.success(`${expense.name} is due again.`),
        onError: (err) => toast.error(getApiErrorMessage(err)),
      },
    )
  const skipOne = (occurrence: Occurrence) =>
    skip.mutate(
      { id: occurrence.expense.id, dueDate: occurrence.due_date, today },
      {
        onSuccess: () =>
          toast.success(`${occurrence.expense.name} skipped.`, {
            action: { label: 'Undo', onClick: () => undoSkip(occurrence) },
          }),
        onError: (err) => toast.error(getApiErrorMessage(err)),
      },
    )

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
      <ul className="space-y-2">
        {occurrences.map((occurrence) => (
          <UpcomingRow
            key={`${occurrence.expense.id}:${occurrence.due_date}`}
            occurrence={occurrence}
            today={today}
            onPay={onPay}
            onSkip={skipOne}
            onUndoSkip={undoSkip}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </ul>
    </div>
  )
}
