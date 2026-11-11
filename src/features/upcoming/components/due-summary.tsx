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
 */
export function DueSummary({
  occurrences,
  today,
  span,
}: {
  occurrences: Occurrence[]
  today: string
  /** Said beside the count when the window is more than a month: "Jan – Nov 2027". */
  span?: string
}) {
  const { toPayCents, overdueCents, paidCents, unpaid, overdue, paid } = summarize(occurrences, today)
  const laterCents = toPayCents - overdueCents
  const barTotal = paidCents + toPayCents
  const segments = [
    { cents: paidCents, className: 'bg-success', label: `${paid} paid` },
    { cents: overdueCents, className: 'bg-destructive', label: `${overdue} overdue`, urgent: true },
    { cents: laterCents, className: 'bg-(--series-1)', label: `${unpaid - overdue} ${overdue > 0 ? 'later' : 'to pay'}` },
  ].filter((segment) => segment.cents > 0)
  const count = unpaid > 0 ? `left · ${plural(unpaid, 'bill')}` : plural(paid, 'bill')

  return (
    <div className="space-y-3">
      <p className="flex flex-wrap items-baseline justify-between gap-x-3">
        {unpaid > 0 ? (
          <span className="figure-lg">{formatMoney(toPayCents / 100)}</span>
        ) : (
          <span className="figure-lg text-success">All paid</span>
        )}
        <span className="text-xs text-muted-foreground">{span ? `${span} · ${count}` : count}</span>
      </p>

      {barTotal > 0 && (
        <>
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
        </>
      )}
    </div>
  )
}
