import { useState } from 'react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useFunds } from '@/features/funds'
import { TransactionDrawer, type Transaction } from '@/features/transactions'
import { getApiErrorMessage } from '@/lib/api-client'
import { cn } from '@/lib/utils'

import { useNoteTotals, useSummary } from '../hooks/use-analytics'
import { useAnalyticsKind } from '../hooks/use-analytics-kind'
import { useAnalyticsRange } from '../hooks/use-analytics-range'
import { KIND_WORDS } from '../lib/kinds'
import { previousRange } from '../lib/ranges'
import { sharesOf } from '../lib/shares'
import type { Kind } from '../types'
import { BreakdownCard } from './breakdown-card'
import { CashFlowCard } from './cash-flow-card'
import { EmptyPeriod } from './empty-period'
import { LargestCard } from './largest-card'
import { PaidFromCard } from './paid-from-card'
import { PeriodPicker } from './period-picker'
import { SpendingCalendar } from './spending-calendar'
import { SummaryHero } from './summary-hero'

/**
 * The Analytics page (redesigned 2026-11-11), a tab each for Expenses and
 * Income, for one period — a month or year stepped back and forth, or a
 * custom range:
 *
 * 1. the hero: the total, the change against the previous period, and a bar
 *    for every day;
 * 2. cash flow: money in against money out by month, and what was kept — the
 *    one place the two tabs meet;
 * 3. the breakdown by note (the note being an entry's type, decided
 *    2026-11-08): a donut and compact rows, the long tail folded;
 * 4. where it was paid from, by allocation or wallet; for a month, a calendar
 *    of the days; then the biggest entries.
 *
 * An empty period says so and points to the last one with any. The tab and
 * the period live in the URL, so each survives the other changing and a trip
 * to a note's page and back.
 */
export function AnalyticsOverview() {
  const [kind, setKind] = useAnalyticsKind()
  const [range, setRange] = useAnalyticsRange()
  const [selected, setSelected] = useState<Transaction | null>(null)

  const totals = useNoteTotals(kind, range.window)
  const summary = useSummary(kind, range.window)
  const previous = useNoteTotals(kind, previousRange(range).window)
  const { funds } = useFunds()
  const unallocatedName = funds.find((fund) => fund.is_unallocated)?.name ?? null

  // `keepPreviousData` holds the other tab's or period's figures while these
  // load; they're shown dimmed, never as this period's.
  const current = totals.data?.kind === kind ? totals.data : undefined
  const currentSummary = summary.data?.kind === kind ? summary.data : undefined
  const stale = totals.isPlaceholderData || summary.isPlaceholderData
  const shares = sharesOf(current?.notes ?? [])
  const error = totals.error ?? summary.error

  return (
    <div className="space-y-4">
      {/* From lg, one toolbar: the tabs left, the period right. */}
      <div className="space-y-4 lg:flex lg:items-center lg:justify-between lg:gap-4 lg:space-y-0">
        <Tabs value={kind} onValueChange={(value) => setKind(value as Kind)}>
          <TabsList className="w-full lg:w-64">
            <TabsTrigger value="expense">{KIND_WORDS.expense.tab}</TabsTrigger>
            <TabsTrigger value="income">{KIND_WORDS.income.tab}</TabsTrigger>
          </TabsList>
        </Tabs>

        <PeriodPicker range={range} onChange={setRange} />
      </div>

      {/*
        One column on a phone; from lg a six-track grid: hero 2fr + Cash flow
        1fr, then three equal cards, then the biggest entries across. Each
        cell is a wrapper so a card that renders a hint beside it (the
        breakdown) stays one cell. `items-start`: a short card keeps its height
        rather than stretching over empty space.
      */}
      <div
        className={cn(
          'space-y-4 transition-opacity lg:grid lg:grid-cols-6 lg:items-start lg:gap-4 lg:space-y-0',
          stale && 'opacity-60',
        )}
        aria-busy={stale || undefined}
      >
        <div className="lg:col-span-4">
          <SummaryHero
            kind={kind}
            range={range}
            total={current?.total}
            count={current?.count}
            days={currentSummary?.days}
            previousTotal={previous.data?.kind === kind ? previous.data.total : undefined}
          />
        </div>

        {error ? (
          <Alert variant="destructive" className="lg:col-span-6">
            <AlertDescription>{getApiErrorMessage(error, 'Could not load these figures.')}</AlertDescription>
          </Alert>
        ) : !current || !currentSummary ? (
          <Skeleton className="h-64 w-full rounded-xl lg:col-span-2" />
        ) : (
          <>
            {/* Kept for an empty period too: other months still hold true, and
                each is a way to one with data. */}
            <div className="lg:col-span-2">
              <CashFlowCard range={range} onPickMonth={setRange} />
            </div>

            {shares.length === 0 ? (
              // Everything below collapses into this one card (rule C).
              <div className="lg:col-span-6">
                <EmptyPeriod
                  kind={kind}
                  range={range}
                  lastBefore={currentSummary.last_before}
                  onPick={setRange}
                />
              </div>
            ) : (
              <>
                {/*
                  A year has no calendar, so its row is two halves rather than
                  three thirds with a hole: the breakdown and Paid from both
                  read better wider than they'd look next to a gap.
                */}
                <div className={cn('space-y-4', range.unit === 'month' ? 'lg:col-span-2' : 'lg:col-span-3')}>
                  <BreakdownCard kind={kind} shares={shares} range={range} />
                </div>
                <div className={range.unit === 'month' ? 'lg:col-span-2' : 'lg:col-span-3'}>
                  <PaidFromCard kind={kind} summary={currentSummary} unallocatedName={unallocatedName} />
                </div>
                {range.unit === 'month' && (
                  <div className="lg:col-span-2">
                    <SpendingCalendar kind={kind} days={currentSummary.days} />
                  </div>
                )}
                {currentSummary.largest.length > 0 && (
                  <div className="lg:col-span-6">
                    <LargestCard kind={kind} entries={currentSummary.largest} onSelect={setSelected} />
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      <TransactionDrawer
        entry={selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null)
        }}
      />
    </div>
  )
}
