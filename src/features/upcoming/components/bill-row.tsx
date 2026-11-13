import { CalendarRange, ChevronRight } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

import { formatMoney } from '@/lib/money'
import { cn } from '@/lib/utils'

import { RECURRENCE_BADGES, shortDate, statusOf, whenText, type RowStatus } from '../lib/upcoming-meta'
import type { Occurrence } from '../types'

const TILE_TONE: Record<RowStatus, string> = {
  overdue: 'border-transparent bg-destructive/10 text-destructive',
  paid: 'border-transparent bg-accent text-accent-foreground',
  skipped: 'text-muted-foreground',
  ended: 'text-muted-foreground',
  partial: '',
  due: '',
}

/**
 * One due date of one bill (2026-11-11, replacing the round-icon row): led by
 * a calendar tile — month over day, as on the due date's own page — so two
 * due dates of one bill read apart at a glance, and the second line is free
 * to say where it stands in days ("23 days overdue"). That line wraps rather
 * than truncating: it is the point of the row.
 *
 * The amount is what's LEFT while owed, what was paid once paid, and the
 * overrun — negative, red — once a paid bill went past its amount.
 *
 * A BUDGET (whole month) has no day: its tile shows the month over a
 * calendar-range mark, it is badged "Budget", and its line counts the days
 * its month has left. Once the month is over it reads "Ended" with what was
 * spent.
 *
 * Rows sit inside a list card (`<ul>` with dividers) — the caller draws it.
 * The link carries where it was opened from, so the page's back button
 * returns to the tab it came from.
 */
export function BillRow({
  occurrence,
  today,
}: {
  occurrence: Occurrence
  /** YYYY-MM-DD in the user's timezone. */
  today: string
}) {
  const { pathname, search } = useLocation()
  const { expense } = occurrence
  const status = statusOf(occurrence, today)
  const [, month, day] = occurrence.due_date.split('-').map(Number)
  const monthLabel = new Date(2000, month - 1, 1).toLocaleDateString('en-US', { month: 'short' })
  const over = status === 'paid' && Number(occurrence.remaining) < 0
  const budget = expense.whole_month
  const badge = [budget && 'Budget', RECURRENCE_BADGES[expense.recurrence]].filter(Boolean).join(' · ')

  return (
    <li className="border-border not-first:border-t">
      <Link
        to={`/upcoming/${expense.id}/${occurrence.due_date}`}
        state={{ from: `${pathname}${search}` }}
        className={cn(
          'flex items-center gap-3 px-4 py-2.5 transition-colors outline-none hover:bg-muted/60 focus-visible:bg-muted/60',
          (status === 'skipped' || status === 'ended') && 'opacity-70',
        )}
      >
        <span
          className={cn(
            'grid h-11 w-10.5 shrink-0 content-center justify-items-center rounded-lg border border-border bg-background leading-none',
            TILE_TONE[status],
          )}
          aria-hidden="true"
        >
          <span className="text-[9.5px] font-bold tracking-wider uppercase opacity-80">{monthLabel}</span>
          {budget ? (
            <CalendarRange className="mt-1 size-4" />
          ) : (
            <span className="mt-0.5 text-base font-semibold tabular-nums">{day}</span>
          )}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="truncate">{expense.name}</span>
          </span>
          <span
            className={cn(
              'block text-xs text-muted-foreground',
              status === 'overdue' && 'font-semibold text-destructive',
              status === 'paid' && (over ? 'font-semibold text-destructive' : 'font-semibold text-success'),
            )}
          >
            {/* The tile is hidden from screen readers; the date is said here. */}
            <span className="sr-only">
              {budget ? `Budget for ${monthLabel}` : shortDate(occurrence.due_date)}:{' '}
            </span>
            {whenText(occurrence, today)}
            {(status === 'due' || status === 'partial') && badge && (
              <span className="font-normal text-muted-foreground"> · {badge}</span>
            )}
          </span>
        </span>

        <span
          className={cn(
            'shrink-0 font-semibold tabular-nums',
            (status === 'paid' || status === 'skipped' || status === 'ended') && 'font-medium text-muted-foreground',
            status === 'skipped' && 'line-through',
            over && 'font-semibold text-destructive',
          )}
        >
          {over
            ? `−${formatMoney(-Number(occurrence.remaining))}`
            : formatMoney(
                status === 'paid' || status === 'ended'
                  ? occurrence.paid
                  : status === 'skipped'
                    ? expense.amount
                    : occurrence.remaining,
              )}
        </span>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </Link>
    </li>
  )
}
