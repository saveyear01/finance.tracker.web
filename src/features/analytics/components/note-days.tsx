import { useState } from 'react'
import { format } from 'date-fns'
import { ChartColumn } from 'lucide-react'

import { EmptyState } from '@/components/layouts/empty-state'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import {
  TransactionDrawer,
  TransactionRow,
  type Transaction,
} from '@/features/transactions'
import { getApiErrorMessage } from '@/lib/api-client'
import { formatMoney } from '@/lib/money'
import { cn } from '@/lib/utils'

import { useNoteDays, useNoteTotals } from '../hooks/use-analytics'
import { useAnalyticsRange } from '../hooks/use-analytics-range'
import { bucketsOf } from '../lib/buckets'
import { countOf, KIND_WORDS } from '../lib/kinds'
import { fromIso, noteLabel, rangeLabel } from '../lib/ranges'
import type { Kind, NoteDays as NoteDaysData } from '../types'
import { DailyChart } from './daily-chart'
import { PeriodPicker } from './period-picker'

/**
 * The figures under the chart, in integer cents (redesigned 2026-11-11): how
 * many times, the average per time, and the last one. A per-DAY average read
 * as "₱26.98 a day" for a car loan paid once a year; per payment is what a
 * note — a bill, a kind of spending — is actually like.
 */
function statsOf(detail: NoteDaysData) {
  const totalCents = Math.round(Number(detail.total) * 100)
  const { monthly } = bucketsOf(detail.days)
  return {
    averageCents: detail.count > 0 ? Math.round(totalCents / detail.count) : null,
    last: detail.entries[0]?.date ?? null,
    monthly,
  }
}

/** The entries under month headings, newest month first. */
function byMonth(entries: Transaction[]): [string, Transaction[]][] {
  const months = new Map<string, Transaction[]>()
  for (const entry of entries) {
    const key = entry.date.slice(0, 7)
    months.set(key, [...(months.get(key) ?? []), entry])
  }
  return [...months]
}

/**
 * One note's expenses or income across the window: how much, a bar per day,
 * and the entries behind the bars. The tab and range are the overview's
 * (they travel in the URL); the range can be changed here without going back.
 *
 * An entry opens the same drawer as on Transactions, to edit or delete it —
 * either refreshes the chart, since Analytics is cached under the ledger's
 * keys. A split income lists each of its legs, as the activity does.
 */
export function NoteDays({ kind, note }: { kind: Kind; note: string | null }) {
  const [range, setRange] = useAnalyticsRange()
  const { data, isLoading, isError, error, isPlaceholderData } = useNoteDays(
    kind,
    note,
    range.window,
  )
  // The whole tab's total for the same period: this note's share of it.
  const all = useNoteTotals(kind, range.window)
  const [selected, setSelected] = useState<Transaction | null>(null)
  const stats = data ? statsOf(data) : null
  const allCents = all.data?.kind === kind ? Math.round(Number(all.data.total) * 100) : 0
  const shareOfAll =
    data && allCents > 0 ? Math.round((Math.round(Number(data.total) * 100) / allCents) * 100) : null
  const words = KIND_WORDS[kind]

  return (
    <div className="space-y-4">
      <PeriodPicker range={range} onChange={setRange} />

      <section className="rounded-2xl bg-secondary p-5 text-secondary-foreground">
        <p className="truncate text-sm opacity-80">
          {words.tab} · <span className={cn(note === null && 'italic')}>{noteLabel(data?.note ?? note)}</span> ·{' '}
          {rangeLabel(range)}
        </p>
        <p className="mt-1 figure-xl">{formatMoney(data?.total ?? 0)}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
          {shareOfAll !== null && (
            <span className="rounded-full bg-secondary-foreground/12 px-2 py-0.5 font-semibold">
              {shareOfAll}% of all {kind === 'income' ? 'income' : 'spending'}
            </span>
          )}
          {data && <span className="opacity-85">{countOf(kind, data.count)}</span>}
        </div>
      </section>

      {isError ? (
        <Alert variant="destructive">
          <AlertDescription>
            {getApiErrorMessage(error, 'Could not load these figures.')}
          </AlertDescription>
        </Alert>
      ) : isLoading || !data || !stats ? (
        <Skeleton className="h-72 w-full rounded-xl" />
      ) : (
        <div className={cn('space-y-4 transition-opacity', isPlaceholderData && 'opacity-60')}>
          <section className="space-y-3 card-surface p-4 text-card-foreground">
            <h2 className="text-sm font-semibold">
              {words.verb} per {stats.monthly ? 'month' : 'day'}
            </h2>
            <DailyChart kind={kind} days={data.days} />
            <dl className="grid grid-cols-3 gap-3 border-t border-border pt-3 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Times</dt>
                <dd className="font-semibold tabular-nums">{data.count}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Average</dt>
                <dd className="truncate font-semibold tabular-nums">
                  {stats.averageCents === null ? '—' : formatMoney(stats.averageCents / 100)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Last</dt>
                <dd className="truncate font-semibold tabular-nums">
                  {stats.last ? format(fromIso(stats.last), 'MMM d') : '—'}
                </dd>
              </div>
            </dl>
          </section>

          {data.entries.length === 0 ? (
            <EmptyState
              icon={ChartColumn}
              title="Nothing in this range"
              description={`Pick another range to see this note's ${words.many}.`}
            />
          ) : (
            <section className="space-y-4">
              {byMonth(data.entries).map(([month, entries]) => (
                <div key={month} className="space-y-2">
                  <h2 className="px-1 text-xs font-bold tracking-wide text-muted-foreground uppercase">
                    {format(fromIso(`${month}-01`), 'MMMM yyyy')}
                  </h2>
                  <ul className="space-y-2">
                    {entries.map((entry) => (
                      <TransactionRow key={entry.id} entry={entry} onSelect={setSelected} />
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          )}
        </div>
      )}

      <TransactionDrawer
        entry={selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null)
        }}
      />
    </div>
  )
}
