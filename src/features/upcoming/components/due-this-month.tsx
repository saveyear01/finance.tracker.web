import { ChevronRight, CircleAlert } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

import { Skeleton } from '@/components/ui/skeleton'
import { localToday } from '@/features/transactions'
import { getApiErrorMessage } from '@/lib/api-client'
import { formatMoney } from '@/lib/money'
import { cn } from '@/lib/utils'

import { useDue, usePinned } from '../hooks/use-upcoming'
import { currentAndNextMonth, RECURRENCE_BADGES, shortDate, statusOf, summarize, type RowStatus } from '../lib/upcoming-meta'
import type { Occurrence } from '../types'

/** Whole days from `from` to `to` (YYYY-MM-DD), counted in UTC so a DST
 * change never makes a day 23 hours. */
function daysBetween(from: string, to: string): number {
  const utc = (value: string) => {
    const [y, m, d] = value.split('-').map(Number)
    return Date.UTC(y, m - 1, d)
  }
  return Math.round((utc(to) - utc(from)) / 86_400_000)
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

/**
 * Home's bills (redesigned 2026-11-11, replacing the Upcoming row and the
 * separate Pinned list): this month's still to pay, overdue included, as one
 * figure and a bar split into paid / overdue / later — and, when the bills
 * left outrun the balance on the card above, by how much. The figures come
 * from the same query as the Upcoming page's first tab, so opening it is
 * instant.
 *
 * Under them, the pinned bills (decided 2026-09-24: this month's, paid ones
 * included), each led by a date tile so two due dates of one bill read apart.
 */
export function DueThisMonth({
  balanceCents,
  setAsideCents,
}: {
  /** What the balance card shows — the allocations that count. */
  balanceCents: number
  /** What the allocations left out of it hold. */
  setAsideCents: number
}) {
  const { current } = currentAndNextMonth()
  const today = localToday()
  const due = useDue(current, { carryOverdue: true })
  const pinned = usePinned(current)

  if (due.isLoading) return <Skeleton className="h-64 w-full rounded-xl" />

  const { toPayCents, overdueCents, paidCents, unpaid, overdue, paid } = summarize(due.occurrences, today)
  const laterCents = toPayCents - overdueCents
  const barTotal = paidCents + toPayCents
  const shortBy = toPayCents - balanceCents
  const segments = [
    { cents: paidCents, className: 'bg-success', label: `${paid} paid` },
    { cents: overdueCents, className: 'bg-destructive', label: `${overdue} overdue`, urgent: true },
    { cents: laterCents, className: 'bg-(--series-1)', label: `${unpaid - overdue} ${overdue > 0 ? 'later' : 'to pay'}` },
  ].filter((segment) => segment.cents > 0)

  return (
    <section className="space-y-3 card-surface p-4 text-card-foreground" aria-labelledby="due-heading">
      <div className="flex items-baseline justify-between gap-2">
        <h2 id="due-heading" className="text-sm font-semibold">
          Due this month
        </h2>
        <Link
          to="/upcoming"
          className="inline-flex items-center gap-0.5 text-sm font-medium text-primary hover:underline"
        >
          See all
          <ChevronRight className="size-4" aria-hidden="true" />
        </Link>
      </div>

      {due.isError ? (
        <p className="text-sm text-destructive">{getApiErrorMessage(due.error, 'Could not load your bills.')}</p>
      ) : due.occurrences.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing due this month.</p>
      ) : (
        <>
          <p className="flex flex-wrap items-baseline justify-between gap-x-3">
            {unpaid > 0 ? (
              <span className="figure-lg">{formatMoney(toPayCents / 100)}</span>
            ) : (
              <span className="figure-lg text-success">All paid</span>
            )}
            <span className="text-xs text-muted-foreground">
              {unpaid > 0 ? `left · ${plural(unpaid, 'bill')}` : plural(paid, 'bill')}
            </span>
          </p>

          {barTotal > 0 && (
            <>
              {/* The legend below carries every figure; the bar is its picture. */}
              <div className="flex h-2 gap-0.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                {segments.map((segment) => (
                  <i
                    key={segment.label}
                    className={cn('block h-full', segment.className)}
                    style={{ width: `${(segment.cents / barTotal) * 100}%` }}
                  />
                ))}
              </div>
              <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {segments.map((segment) => (
                  <li key={segment.label} className="inline-flex items-center gap-1.5">
                    <i className={cn('size-2.5 rounded-[3px]', segment.className)} aria-hidden="true" />
                    <span className={cn(segment.urgent && 'font-semibold text-destructive')}>{segment.label}</span>
                    <span className="font-semibold text-foreground tabular-nums">
                      {formatMoney(segment.cents / 100)}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}

          {shortBy > 0 && (
            <p className="flex gap-2.5 rounded-lg bg-muted px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
              <CircleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              <span>
                That's <b className="font-semibold text-foreground">{formatMoney(shortBy / 100)} more</b> than your
                total balance.
                {setAsideCents > 0 &&
                  ` Another ${formatMoney(setAsideCents / 100)} is set aside in allocations left out of it.`}
              </span>
            </p>
          )}
        </>
      )}

      <div className="-mx-4 -mb-4">
        <h3 className="px-4 pt-1 pb-2 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
          Pinned
        </h3>
        {pinned.isLoading ? (
          <Skeleton className="mx-4 mb-4 h-16 rounded-lg" />
        ) : pinned.isError ? (
          <p className="border-t border-border px-4 py-3 text-sm text-destructive">
            {getApiErrorMessage(pinned.error, 'Could not load your pinned expenses.')}
          </p>
        ) : pinned.occurrences.length === 0 ? (
          <p className="border-t border-border px-4 py-3 text-sm text-muted-foreground">
            Open an upcoming expense and pin it to keep it here in the months it's due.
          </p>
        ) : (
          <ul>
            {pinned.occurrences.map((occurrence) => (
              <PinnedRow key={`${occurrence.expense.id}:${occurrence.due_date}`} occurrence={occurrence} today={today} />
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

const TILE_TONE: Record<RowStatus, string> = {
  overdue: 'border-transparent bg-destructive/10 text-destructive',
  paid: 'border-transparent bg-accent text-accent-foreground',
  skipped: 'text-muted-foreground',
  partial: '',
  due: '',
}

/**
 * One pinned due date, led by a calendar tile (month over day, as on the due
 * date's own page) — two due dates of one bill read apart at a glance. The
 * second line says where it stands in days, never truncated into "…".
 */
function PinnedRow({ occurrence, today }: { occurrence: Occurrence; today: string }) {
  const { pathname, search } = useLocation()
  const { expense } = occurrence
  const status = statusOf(occurrence, today)
  const [, month, day] = occurrence.due_date.split('-').map(Number)
  const monthLabel = new Date(2000, month - 1, 1).toLocaleDateString('en-US', { month: 'short' })
  const days = daysBetween(today, occurrence.due_date)
  const over = status === 'paid' && Number(occurrence.remaining) < 0
  const badge = RECURRENCE_BADGES[expense.recurrence]

  const when = {
    overdue: `${plural(-days, 'day')} overdue`,
    paid: over ? 'Over budget' : `Paid ${shortDate(occurrence.payments.at(-1)?.paid_on ?? occurrence.due_date)}`,
    skipped: 'Skipped',
    partial: `${formatMoney(occurrence.paid)} of ${formatMoney(expense.amount)} paid`,
    due: days === 0 ? 'Due today' : days === 1 ? 'Due tomorrow' : `Due in ${days} days`,
  }[status]

  return (
    <li>
      <Link
        to={`/upcoming/${expense.id}/${occurrence.due_date}`}
        state={{ from: `${pathname}${search}` }}
        className="flex items-center gap-3 border-t border-border px-4 py-2.5 transition-colors outline-none hover:bg-muted/60 focus-visible:bg-muted/60"
      >
        <span
          className={cn(
            'grid h-11 w-10.5 shrink-0 content-center justify-items-center rounded-lg border border-border bg-background leading-none',
            TILE_TONE[status],
          )}
          aria-hidden="true"
        >
          <span className="text-[9.5px] font-bold tracking-wider uppercase opacity-80">{monthLabel}</span>
          <span className="mt-0.5 text-base font-semibold tabular-nums">{day}</span>
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium">{expense.name}</span>
          <span
            className={cn(
              'block truncate text-xs text-muted-foreground',
              status === 'overdue' && 'font-semibold text-destructive',
              status === 'paid' && (over ? 'font-semibold text-destructive' : 'font-semibold text-success'),
            )}
          >
            {/* The tile is hidden from screen readers; the date is said here. */}
            <span className="sr-only">{shortDate(occurrence.due_date)}: </span>
            {when}
            {status === 'due' && badge && <span className="font-normal text-muted-foreground"> · {badge}</span>}
          </span>
        </span>

        <span
          className={cn(
            'shrink-0 font-semibold tabular-nums',
            (status === 'paid' || status === 'skipped') && 'font-medium text-muted-foreground',
            over && 'font-semibold text-destructive',
          )}
        >
          {over
            ? `−${formatMoney(-Number(occurrence.remaining))}`
            : formatMoney(status === 'paid' ? occurrence.paid : status === 'skipped' ? expense.amount : occurrence.remaining)}
        </span>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </Link>
    </li>
  )
}
