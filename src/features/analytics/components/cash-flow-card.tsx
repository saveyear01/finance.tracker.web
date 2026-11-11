import { format } from 'date-fns'

import { Skeleton } from '@/components/ui/skeleton'
import { formatMoney } from '@/lib/money'
import { cn } from '@/lib/utils'

import { useSummary } from '../hooks/use-analytics'
import { fromIso, iso, monthOf, type AnalyticsRange } from '../lib/ranges'
import type { DateWindow, DayTotal } from '../types'

/** How far back the cash flow looks from a month. */
const MONTHS_BACK = 6

/**
 * The months the cash flow charts: the six ending at a picked month, the
 * picked year's twelve, or the custom window's own months.
 */
function cashFlowWindow(range: AnalyticsRange): DateWindow {
  if (range.unit !== 'month') return range.window
  const start = fromIso(range.window.start)
  return {
    start: iso(new Date(start.getFullYear(), start.getMonth() - (MONTHS_BACK - 1), 1)),
    end: range.window.end,
  }
}

/** Cents per month (YYYY-MM), from per-day totals. */
function byMonth(days: DayTotal[] | undefined): Map<string, number> {
  const months = new Map<string, number>()
  for (const day of days ?? []) {
    const key = day.date.slice(0, 7)
    months.set(key, (months.get(key) ?? 0) + Math.round(Number(day.total) * 100))
  }
  return months
}

/** Cents within the window, from per-day totals. */
function within(days: DayTotal[] | undefined, window: DateWindow): number {
  return (days ?? [])
    .filter((day) => day.date >= window.start && day.date <= window.end)
    .reduce((sum, day) => sum + Math.round(Number(day.total) * 100), 0)
}

/**
 * Money in against money out, month by month, and what was kept in the
 * period picked — the one place expenses and income meet. A month is a
 * button: tapping it opens that month.
 *
 * Bars are plain elements rather than a chart library: two series, a few
 * months, and each bar needs to be a labelled control.
 */
export function CashFlowCard({
  range,
  onPickMonth,
}: {
  range: AnalyticsRange
  onPickMonth: (range: AnalyticsRange) => void
}) {
  const window = cashFlowWindow(range)
  const income = useSummary('income', window)
  const expense = useSummary('expense', window)

  if (!income.data || !expense.data) {
    return <Skeleton className="h-56 w-full rounded-xl" />
  }

  const inMonths = byMonth(income.data.days)
  const outMonths = byMonth(expense.data.days)
  const months = [...new Set([...inMonths.keys(), ...outMonths.keys()])].sort()
  const max = Math.max(1, ...months.map((m) => Math.max(inMonths.get(m) ?? 0, outMonths.get(m) ?? 0)))
  const picked = range.unit === 'month' ? range.window.start.slice(0, 7) : null

  const kept = within(income.data.days, range.window) - within(expense.data.days, range.window)
  const received = within(income.data.days, range.window)
  const keptShare = received > 0 ? Math.round((kept / received) * 100) : null

  return (
    <section className="space-y-3 card-surface p-4 text-card-foreground">
      <h2 className="flex items-baseline justify-between gap-2 text-sm font-semibold">
        Cash flow
        <span className="text-xs font-normal text-muted-foreground">
          {range.unit === 'month' ? `last ${MONTHS_BACK} months` : 'by month'}
        </span>
      </h2>

      <div className="flex h-32 items-end gap-1 border-b border-border">
        {months.map((month) => {
          const inc = inMonths.get(month) ?? 0
          const out = outMonths.get(month) ?? 0
          const date = fromIso(`${month}-01`)
          return (
            <button
              key={month}
              type="button"
              onClick={() => onPickMonth(monthOf(date))}
              aria-label={`${format(date, 'MMMM yyyy')}: received ${formatMoney(inc / 100)}, spent ${formatMoney(out / 100)}`}
              aria-current={month === picked ? 'true' : undefined}
              className={cn(
                'flex h-full min-w-0 flex-1 items-end justify-center gap-[3px] rounded-t-lg px-0.5 transition-colors outline-none hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50',
                month === picked && 'bg-muted',
              )}
            >
              <Bar cents={inc} max={max} className="bg-success" />
              <Bar cents={out} max={max} className="bg-(--series-1)" />
            </button>
          )
        })}
      </div>
      <div className="flex gap-1 text-[10.5px] text-muted-foreground" aria-hidden="true">
        {months.map((month) => (
          <span
            key={month}
            className={cn('min-w-0 flex-1 text-center', month === picked && 'font-bold text-foreground')}
          >
            {format(fromIso(`${month}-01`), months.length > 6 ? 'MMMMM' : 'MMM')}
          </span>
        ))}
      </div>

      <div className="flex gap-4 text-xs text-muted-foreground" aria-hidden="true">
        <span className="inline-flex items-center gap-1.5">
          <i className="size-2.5 rounded-[3px] bg-success" />
          Received
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="size-2.5 rounded-[3px] bg-(--series-1)" />
          Spent
        </span>
      </div>

      {received === 0 && kept === 0 ? (
        <p className="border-t border-border pt-3 text-sm text-muted-foreground">
          Nothing came in or went out {range.unit === 'month' ? 'this month' : 'in this period'}.
        </p>
      ) : (
      <div className="flex items-baseline justify-between gap-3 border-t border-border pt-3 text-sm">
        <span className="text-muted-foreground">
          {kept >= 0 ? 'You kept' : 'You spent more than came in'}
        </span>
        <span
          className={cn(
            'font-semibold tabular-nums',
            kept >= 0 ? 'text-success' : 'text-destructive',
          )}
        >
          {kept >= 0 ? '+' : '−'}
          {formatMoney(Math.abs(kept) / 100)}
          {keptShare !== null && kept >= 0 && ` · ${keptShare}%`}
        </span>
      </div>
      )}
    </section>
  )
}

function Bar({ cents, max, className }: { cents: number; max: number; className: string }) {
  return (
    <span
      className={cn('w-2 max-w-[40%] rounded-t-[3px]', cents > 0 ? className : 'bg-border')}
      style={{ height: cents > 0 ? `${Math.max(3, (cents / max) * 100)}%` : '2px' }}
    />
  )
}
