import { formatMoney } from '@/lib/money'
import { cn } from '@/lib/utils'

import { summarize } from '../lib/upcoming-meta'
import type { Occurrence } from '../types'

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

/**
 * A window's bills at a glance (2026-11-11): what's left to pay as the
 * figure, then a bar split into paid / overdue / still to come with a legend
 * carrying every amount — the bar is its picture, so it is hidden from
 * screen readers. Home's card and each Upcoming tab show the same thing.
 *
 * `wide` is Upcoming's summary from lg: one card across the page, the figure
 * on the left and the bar with its legend beside it, rather than stacked.
 * With no bills at all it reads ₱0.00 — "All paid" would claim something
 * that never happened.
 */
export function DueSummary({
  occurrences,
  today,
  span,
  wide = false,
}: {
  occurrences: Occurrence[]
  today: string
  /** Said beside the count when the window is more than a month: "Jan – Nov 2027". */
  span?: string
  wide?: boolean
}) {
  const { toPayCents, overdueCents, paidCents, unpaid, overdue, paid } = summarize(occurrences, today)
  const laterCents = toPayCents - overdueCents
  const barTotal = paidCents + toPayCents
  const segments = [
    { cents: paidCents, className: 'bg-success', label: `${paid} paid` },
    { cents: overdueCents, className: 'bg-destructive', label: `${overdue} overdue`, urgent: true },
    { cents: laterCents, className: 'bg-(--series-1)', label: `${unpaid - overdue} ${overdue > 0 ? 'later' : 'to pay'}` },
  ].filter((segment) => segment.cents > 0)
  const empty = occurrences.length === 0
  const count = empty ? 'No bills' : unpaid > 0 ? `left · ${plural(unpaid, 'bill')}` : plural(paid, 'bill')

  return (
    <div
      className={cn(
        'space-y-3',
        wide && 'lg:grid lg:grid-cols-[auto_minmax(0,1fr)] lg:items-center lg:gap-x-10 lg:space-y-0',
      )}
    >
      <p
        className={cn(
          'flex flex-wrap items-baseline justify-between gap-x-3',
          wide && 'lg:flex-col lg:items-start lg:gap-y-0.5',
        )}
      >
        {unpaid > 0 || empty ? (
          <span className="figure-lg">{formatMoney(toPayCents / 100)}</span>
        ) : (
          <span className="figure-lg text-success">All paid</span>
        )}
        <span className="text-xs text-muted-foreground">{span ? `${span} · ${count}` : count}</span>
      </p>

      {/* Wide and empty: the bar's track alone, so a month at zero keeps the
          card's shape instead of collapsing to a figure. */}
      {barTotal === 0 && wide && (
        <div className="hidden h-2 rounded-full bg-muted lg:block" aria-hidden="true" />
      )}
      {barTotal > 0 && (
        <div className="space-y-3">
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
                <span className="font-semibold text-foreground tabular-nums">{formatMoney(segment.cents / 100)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
