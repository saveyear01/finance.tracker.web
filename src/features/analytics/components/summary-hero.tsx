import { ArrowDown, ArrowUp } from 'lucide-react'

import { localToday } from '@/features/transactions'
import { formatMoney } from '@/lib/money'

import { bucketsOf } from '../lib/buckets'
import { countOf, KIND_WORDS } from '../lib/kinds'
import { elapsedDays, previousPhrase, rangePhrase, type AnalyticsRange } from '../lib/ranges'
import type { DayTotal, Kind } from '../types'

/**
 * The period at a glance, on the dark card: the total with its centavos
 * dimmed, the change against the previous period, the count and (for a
 * month) the average per day so far, and a bar for every day — or every
 * month, for a year — so the shape of the period reads before any number.
 *
 * The change is a neutral chip, not red or green: more spending isn't always
 * bad (a yearly bill), and colour alone would say otherwise.
 */
export function SummaryHero({
  kind,
  range,
  total,
  count,
  days,
  previousTotal,
}: {
  kind: Kind
  range: AnalyticsRange
  /** Decimal strings, or undefined while loading. */
  total: string | undefined
  count: number | undefined
  days: DayTotal[] | undefined
  previousTotal: string | undefined
}) {
  const words = KIND_WORDS[kind]
  const today = localToday()
  const formatted = formatMoney(total ?? 0)
  const point = formatted.lastIndexOf('.')
  const [whole, cents] =
    point === -1 ? [formatted, ''] : [formatted.slice(0, point), formatted.slice(point)]

  const totalCents = Math.round(Number(total ?? 0) * 100)
  const prevCents = previousTotal === undefined ? null : Math.round(Number(previousTotal) * 100)
  const elapsed = elapsedDays(range.window, today)
  const ongoing = range.window.start <= today && today < range.window.end
  const perDay = range.unit === 'month' && elapsed > 0 && totalCents > 0 ? totalCents / elapsed : null

  const { buckets, monthly } = bucketsOf(days ?? [])
  const max = Math.max(1, ...buckets.map((bucket) => bucket.total))
  const todayKey = monthly ? today.slice(0, 7) : today

  return (
    <section className="rounded-2xl bg-secondary p-5 pb-4 text-secondary-foreground">
      <p className="text-sm opacity-80">
        {words.verb} {rangePhrase(range)}
        {ongoing && ' · so far'}
      </p>
      <p className="mt-1 figure-xl">
        {whole}
        <span className="text-secondary-foreground/50">{cents}</span>
      </p>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
        {prevCents !== null && (
          <span className="inline-flex items-center gap-1 rounded-full bg-secondary-foreground/12 px-2 py-0.5 font-semibold">
            {prevCents === 0 ? (
              `Nothing ${kind === 'income' ? 'received' : 'spent'} in ${previousPhrase(range)}`
            ) : totalCents === prevCents ? (
              `Same as ${previousPhrase(range)}`
            ) : (
              <>
                {totalCents > prevCents ? (
                  <ArrowUp className="size-3" aria-hidden="true" />
                ) : (
                  <ArrowDown className="size-3" aria-hidden="true" />
                )}
                <span className="sr-only">{totalCents > prevCents ? 'Up' : 'Down'}</span>
                {formatMoney(Math.abs(totalCents - prevCents) / 100)} vs {previousPhrase(range)}
              </>
            )}
          </span>
        )}
        {count !== undefined && (
          <span className="opacity-85">
            {countOf(kind, count)}
            {perDay !== null && ` · ${formatMoney(Math.round(perDay) / 100)} a day`}
          </span>
        )}
      </div>

      {buckets.length > 1 && (
        // Decorative: the figures are in the cards below and on each note's page.
        <div aria-hidden="true">
          <div className="mt-4 flex h-12 items-end gap-[2px]">
            {buckets.map((bucket) => (
              <span
                key={bucket.key}
                title={`${bucket.title}: ${formatMoney(bucket.total)}`}
                className={
                  bucket.total > 0
                    ? 'min-h-[3px] flex-1 rounded-t-[2px] bg-secondary-accent'
                    : 'h-[3px] flex-1 rounded-t-[2px] bg-secondary-foreground/15'
                }
                style={{
                  height: bucket.total > 0 ? `${Math.max(8, (bucket.total / max) * 100)}%` : undefined,
                  opacity: bucket.key > todayKey ? 0.35 : undefined,
                }}
              />
            ))}
          </div>
          <div className="mt-1 flex justify-between text-[10.5px] tabular-nums opacity-60">
            <span>{buckets[0].short}</span>
            <span>{buckets[buckets.length - 1].short}</span>
          </div>
        </div>
      )}
    </section>
  )
}
