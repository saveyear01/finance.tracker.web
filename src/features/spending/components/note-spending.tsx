import { useState } from 'react'
import { ChartColumn } from 'lucide-react'

import { EmptyState } from '@/components/layouts/empty-state'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import {
  localToday,
  TransactionDrawer,
  TransactionRow,
  type Transaction,
} from '@/features/transactions'
import { getApiErrorMessage } from '@/lib/api-client'
import { formatMoney } from '@/lib/money'
import { cn } from '@/lib/utils'

import { useNoteSpending } from '../hooks/use-spending'
import { useSpendingRange } from '../hooks/use-spending-range'
import { bucketsOf } from '../lib/buckets'
import { daysIn, formatWindow, noteLabel } from '../lib/ranges'
import type { NoteSpendingDetail } from '../types'
import { DailyChart } from './daily-chart'
import { RangePicker } from './range-picker'

/**
 * The figures under the chart, in integer cents: the average per day and the
 * busiest bar.
 *
 * The average is over the days that have HAPPENED — this month's average on
 * the 8th is a week's spending over a week, not over thirty days, most of
 * which are still to come.
 */
function statsOf(detail: NoteSpendingDetail) {
  const today = localToday()
  const end = detail.end < today ? detail.end : today
  const elapsed = end < detail.start ? 0 : daysIn({ start: detail.start, end })
  const spentCents = Math.round(Number(detail.spent) * 100)

  const { buckets, monthly } = bucketsOf(detail.days)
  const top = buckets.reduce<(typeof buckets)[number] | null>(
    (best, bucket) => (bucket.spent > (best?.spent ?? 0) ? bucket : best),
    null,
  )

  return {
    perDayCents: elapsed > 0 ? Math.round(spentCents / elapsed) : null,
    top,
    monthly,
  }
}

/**
 * One note's spending across the window: how much, a bar per day, and the
 * expenses behind the bars. The range is the overview's (it travels in the
 * URL), and can be changed here without going back.
 *
 * An entry opens the same drawer as on Transactions, to edit or delete it —
 * either refreshes the chart, since spending is cached under the ledger's
 * keys.
 */
export function NoteSpending({ note }: { note: string | null }) {
  const [range, setRange] = useSpendingRange()
  const { data, isLoading, isError, error, isPlaceholderData } = useNoteSpending(
    note,
    range.window,
  )
  const [selected, setSelected] = useState<Transaction | null>(null)
  const stats = data ? statsOf(data) : null

  return (
    <div className="space-y-4">
      <section className="rounded-2xl bg-secondary p-5 text-secondary-foreground">
        <p className={cn('truncate text-sm opacity-80', note === null && 'italic')}>
          {noteLabel(data?.note ?? note)}
        </p>
        <p className="mt-1 text-3xl font-semibold tabular-nums">{formatMoney(data?.spent ?? 0)}</p>
        <p className="mt-1 text-sm opacity-80">
          {formatWindow(range.window)}
          {data && ` · ${data.count} ${data.count === 1 ? 'expense' : 'expenses'}`}
        </p>
      </section>

      <RangePicker range={range} onChange={setRange} />

      {isError ? (
        <Alert variant="destructive">
          <AlertDescription>
            {getApiErrorMessage(error, 'Could not load this spending.')}
          </AlertDescription>
        </Alert>
      ) : isLoading || !data || !stats ? (
        <Skeleton className="h-72 w-full rounded-xl" />
      ) : (
        <div className={cn('space-y-4 transition-opacity', isPlaceholderData && 'opacity-60')}>
          <section className="space-y-3 rounded-xl border border-border bg-card p-4 text-card-foreground">
            <h2 className="text-sm font-semibold">
              Spent per {stats.monthly ? 'month' : 'day'}
            </h2>
            <DailyChart days={data.days} />
            <dl className="grid grid-cols-2 gap-3 border-t border-border pt-3 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Average per day</dt>
                <dd className="font-semibold tabular-nums">
                  {stats.perDayCents === null ? '—' : formatMoney(stats.perDayCents / 100)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">
                  Highest {stats.monthly ? 'month' : 'day'}
                </dt>
                <dd className="truncate font-semibold tabular-nums">
                  {stats.top ? (
                    <>
                      {formatMoney(stats.top.spent)}
                      <span className="ml-1 text-xs font-normal text-muted-foreground">
                        {stats.top.short}
                      </span>
                    </>
                  ) : (
                    '—'
                  )}
                </dd>
              </div>
            </dl>
          </section>

          {data.entries.length === 0 ? (
            <EmptyState
              icon={ChartColumn}
              title="Nothing spent in this range"
              description="Pick another range to see this note's expenses."
            />
          ) : (
            <section className="space-y-2">
              <h2 className="font-semibold">Expenses</h2>
              <ul className="space-y-2">
                {data.entries.map((entry) => (
                  <TransactionRow key={entry.id} entry={entry} onSelect={setSelected} />
                ))}
              </ul>
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
