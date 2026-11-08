import { ChartColumn, ChartPie, List } from 'lucide-react'

import { EmptyState } from '@/components/layouts/empty-state'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getApiErrorMessage } from '@/lib/api-client'
import { formatMoney } from '@/lib/money'
import { cn } from '@/lib/utils'

import { useSpendingSummary } from '../hooks/use-spending'
import { useSpendingRange } from '../hooks/use-spending-range'
import { useSpendingView, type SpendingView } from '../hooks/use-spending-view'
import { formatWindow, PRESET_LABELS } from '../lib/ranges'
import { sharesOf } from '../lib/shares'
import { NotePie } from './note-pie'
import { NoteRows } from './note-rows'
import { RangePicker } from './range-picker'

/**
 * The Analytics page: what went out in the window, then where it went — by
 * note, the note being the expense's type (decided 2026-11-08). Expenses
 * with no note are "Others".
 *
 * Two views of the same figures, the user's pick: a pie with its legend
 * (the default), or the list of rows with a bar of each share. Either way a
 * note opens its own page, which charts it day by day. Shares are whole
 * percentages that add up to exactly 100 (`wholePercents`, the same rule
 * the wallet and allocation breakdowns use).
 */
export function SpendingOverview() {
  const [range, setRange] = useSpendingRange()
  const [view, setView] = useSpendingView()
  const { data, isLoading, isError, error, isPlaceholderData } = useSpendingSummary(range.window)

  const shares = sharesOf(data?.notes ?? [])

  return (
    <div className="space-y-4">
      <section className="rounded-2xl bg-secondary p-5 text-secondary-foreground">
        <p className="text-sm opacity-80">
          Spent · {range.preset === 'custom' ? 'Custom range' : PRESET_LABELS[range.preset]}
        </p>
        <p className="mt-1 text-3xl font-semibold tabular-nums">
          {formatMoney(data?.spent ?? 0)}
        </p>
        <p className="mt-1 text-sm opacity-80">
          {formatWindow(range.window)}
          {data && ` · ${data.count} ${data.count === 1 ? 'expense' : 'expenses'}`}
        </p>
      </section>

      <RangePicker range={range} onChange={setRange} />

      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold">Where it went</h2>
        <Tabs value={view} onValueChange={(value) => setView(value as SpendingView)}>
          {/* Icon-only, so the picked one is filled in primary: the theme's
              muted and background are a shade apart and wouldn't show it. */}
          <TabsList aria-label="Show as" className="h-9 border border-border">
            <TabsTrigger
              value="pie"
              aria-label="Pie chart"
              title="Pie chart"
              className="px-2 data-active:bg-primary! data-active:text-primary-foreground!"
            >
              <ChartPie />
            </TabsTrigger>
            <TabsTrigger
              value="list"
              aria-label="List"
              title="List"
              className="px-2 data-active:bg-primary! data-active:text-primary-foreground!"
            >
              <List />
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {isError ? (
        <Alert variant="destructive">
          <AlertDescription>
            {getApiErrorMessage(error, 'Could not load your spending.')}
          </AlertDescription>
        </Alert>
      ) : isLoading ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : shares.length === 0 ? (
        <EmptyState
          icon={ChartColumn}
          title="Nothing spent"
          description="Expenses in this range show up here, grouped by their note."
        />
      ) : (
        <div className={cn('space-y-4 transition-opacity', isPlaceholderData && 'opacity-60')}>
          {view === 'pie' && (
            <section className="rounded-xl border border-border bg-card p-4 text-card-foreground">
              <NotePie shares={shares} />
            </section>
          )}
          <NoteRows shares={shares} range={range} variant={view === 'pie' ? 'legend' : 'list'} />
        </div>
      )}
    </div>
  )
}
