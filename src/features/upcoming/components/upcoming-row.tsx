import { CalendarClock, CalendarX2, CircleCheck, CircleSlash, PieChart } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { formatMoney } from '@/lib/money'
import { cn } from '@/lib/utils'

import { RECURRENCE_BADGES, shortDate, statusOf, type RowStatus } from '../lib/upcoming-meta'
import type { Occurrence, UpcomingExpense } from '../types'
import { UpcomingActions } from './upcoming-actions'

const STATUS_ICON = {
  paid: CircleCheck,
  skipped: CircleSlash,
  overdue: CalendarX2,
  partial: PieChart,
  due: CalendarClock,
} satisfies Record<RowStatus, unknown>

const ICON_TONE: Record<RowStatus, string> = {
  paid: 'bg-success/10 text-success',
  skipped: 'bg-muted text-muted-foreground',
  overdue: 'bg-destructive/10 text-destructive',
  partial: 'bg-primary/10 text-primary',
  due: 'bg-muted text-muted-foreground',
}

/**
 * One due date of one bill: its name, where it stands, how it repeats, and
 * an amount — what's LEFT to pay while it's owed (the bill's own amount
 * never changes; a partly paid one says how much of it is paid), what was
 * paid once paid.
 *
 * Owed ones carry Pay; overdue ones also Skip. A skipped one stays, muted,
 * and its menu can undo the skip.
 */
export function UpcomingRow({
  occurrence,
  today,
  onPay,
  onSkip,
  onUndoSkip,
  onEdit,
  onDelete,
}: {
  occurrence: Occurrence
  /** YYYY-MM-DD in the user's timezone — what "overdue" is measured from. */
  today: string
  onPay: (occurrence: Occurrence) => void
  onSkip: (occurrence: Occurrence) => void
  onUndoSkip: (occurrence: Occurrence) => void
  onEdit: (expense: UpcomingExpense) => void
  onDelete: (expense: UpcomingExpense) => void
}) {
  const { expense, payments } = occurrence
  const status = statusOf(occurrence, today)
  const Icon = STATUS_ICON[status]
  const owed = status === 'overdue' || status === 'partial' || status === 'due'
  const partlyPaid = Number(occurrence.paid) > 0 && status !== 'paid'
  const progress = partlyPaid
    ? `${formatMoney(occurrence.paid)} of ${formatMoney(expense.amount)} paid`
    : null

  const when = {
    paid: `Paid ${shortDate(payments.at(-1)?.paid_on ?? occurrence.due_date)}`,
    skipped: `Skipped · was due ${shortDate(occurrence.due_date)}`,
    overdue: `Overdue · was due ${shortDate(occurrence.due_date)}`,
    partial: `Due ${shortDate(occurrence.due_date)}`,
    due: `Due ${shortDate(occurrence.due_date)}`,
  }[status]
  const badge = RECURRENCE_BADGES[expense.recurrence]

  return (
    <li
      className={cn(
        'flex items-center gap-3 rounded-xl border border-border bg-card p-3 text-card-foreground',
        status === 'skipped' && 'opacity-70',
      )}
    >
      <span
        className={cn('grid size-10 shrink-0 place-items-center rounded-full', ICON_TONE[status])}
      >
        <Icon className="size-4" aria-hidden="true" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{expense.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          <span
            className={cn(
              status === 'paid' && 'text-success',
              status === 'overdue' && 'font-medium text-destructive',
            )}
          >
            {when}
          </span>
          {badge && ` · ${badge}`}
        </p>
        {progress && <p className="truncate text-xs text-muted-foreground">{progress}</p>}
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1">
        <span
          className={cn(
            'font-semibold tabular-nums',
            status === 'skipped' && 'text-muted-foreground line-through',
          )}
        >
          {formatMoney(
            owed ? occurrence.remaining : status === 'paid' ? occurrence.paid : expense.amount,
          )}
        </span>
        {owed && (
          <div className="flex gap-1">
            {status === 'overdue' && (
              <Button size="xs" variant="outline" onClick={() => onSkip(occurrence)}>
                Skip
              </Button>
            )}
            <Button size="xs" onClick={() => onPay(occurrence)}>
              Pay
            </Button>
          </div>
        )}
      </div>

      <UpcomingActions
        expense={expense}
        onEdit={onEdit}
        onDelete={onDelete}
        onUndoSkip={status === 'skipped' ? () => onUndoSkip(occurrence) : undefined}
      />
    </li>
  )
}
