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
      <Tabs value={kind} onValueChange={(value) => setKind(value as Kind)}>
        <TabsList className="w-full">
          <TabsTrigger value="expense">{KIND_WORDS.expense.tab}</TabsTrigger>
          <TabsTrigger value="income">{KIND_WORDS.income.tab}</TabsTrigger>
        </TabsList>
      </Tabs>

      <PeriodPicker range={range} onChange={setRange} />

      <div className={cn('space-y-4 transition-opacity', stale && 'opacity-60')} aria-busy={stale || undefined}>
        <SummaryHero
          kind={kind}
          range={range}
          total={current?.total}
          count={current?.count}
          days={currentSummary?.days}
          previousTotal={previous.data?.kind === kind ? previous.data.total : undefined}
        />

        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{getApiErrorMessage(error, 'Could not load these figures.')}</AlertDescription>
          </Alert>
        ) : !current || !currentSummary ? (
          <Skeleton className="h-64 w-full rounded-xl" />
        ) : (
          <>
            <CashFlowCard range={range} onPickMonth={setRange} />

            {shares.length === 0 ? (
              <EmptyPeriod
                kind={kind}
                range={range}
                lastBefore={currentSummary.last_before}
                onPick={setRange}
              />
            ) : (
              <>
                <BreakdownCard kind={kind} shares={shares} range={range} />
                <PaidFromCard kind={kind} summary={currentSummary} unallocatedName={unallocatedName} />
                {range.unit === 'month' && <SpendingCalendar kind={kind} days={currentSummary.days} />}
                <LargestCard kind={kind} entries={currentSummary.largest} onSelect={setSelected} />
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
