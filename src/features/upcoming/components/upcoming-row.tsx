import {
  CalendarClock,
  CalendarX2,
  ChevronRight,
  CircleCheck,
  CircleSlash,
  PieChart,
  Pin,
} from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

import { formatMoney } from '@/lib/money'
import { cn } from '@/lib/utils'

import { RECURRENCE_BADGES, shortDate, statusOf, type RowStatus } from '../lib/upcoming-meta'
import type { Occurrence } from '../types'

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
 * The whole row opens that due date's own page, which is where it is paid,
 * skipped, edited or deleted, and where its payments are listed. The list
 * stays a list: a month of bills reads at a glance rather than as a wall of
 * buttons, and staggered payments have somewhere to live.
 *
 * The link carries where it was opened from, so the page's back button
 * returns to the tab you were on rather than always the first one.
 */
export function UpcomingRow({
  occurrence,
  today,
}: {
  occurrence: Occurrence
  /** YYYY-MM-DD in the user's timezone — what "overdue" is measured from. */
  today: string
}) {
  const { pathname, search } = useLocation()
  const { expense, payments } = occurrence
  const status = statusOf(occurrence, today)
  const Icon = STATUS_ICON[status]
  const owed = status === 'overdue' || status === 'partial' || status === 'due'
  const partlyPaid = Number(occurrence.paid) > 0 && status !== 'paid'
  // Paid past the bill's amount: the API's `remaining` is negative by that much.
  const over = status === 'paid' && Number(occurrence.remaining) < 0
  const progress =
    partlyPaid || over
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
    <li>
      <Link
        to={`/upcoming/${expense.id}/${occurrence.due_date}`}
        state={{ from: `${pathname}${search}` }}
        className={cn(
          'flex items-center gap-3 rounded-xl border border-border bg-card p-3 text-card-foreground transition-colors outline-none hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50',
          status === 'skipped' && 'opacity-70',
        )}
      >
        <span
          className={cn('grid size-10 shrink-0 place-items-center rounded-full', ICON_TONE[status])}
        >
          <Icon className="size-4" aria-hidden="true" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 font-medium">
            <span className="truncate">{expense.name}</span>
            {/* A pinned bill is also on Home; say so where it's listed. */}
            {expense.pinned_at !== null && (
              <Pin className="size-3.5 shrink-0 text-muted-foreground" aria-label="Pinned" />
            )}
          </p>
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

        {/* What's left while owed; what was paid once paid — unless it went
            OVER, when the figure is the overrun, negative and red, so a
            bill that ran past its budget says so from the list. */}
        <span
          className={cn(
            'shrink-0 font-semibold tabular-nums',
            status === 'skipped' && 'text-muted-foreground line-through',
            over && 'text-destructive',
          )}
        >
          {over
            ? `−${formatMoney(-Number(occurrence.remaining))}`
            : formatMoney(
                owed ? occurrence.remaining : status === 'paid' ? occurrence.paid : expense.amount,
              )}
        </span>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </Link>
    </li>
  )
}
