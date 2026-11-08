import { ChartColumn, ChartPie, List } from 'lucide-react'

import { EmptyState } from '@/components/layouts/empty-state'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getApiErrorMessage } from '@/lib/api-client'
import { formatMoney } from '@/lib/money'
import { cn } from '@/lib/utils'

import { useNoteTotals } from '../hooks/use-analytics'
import { useAnalyticsKind } from '../hooks/use-analytics-kind'
import { useAnalyticsRange } from '../hooks/use-analytics-range'
import { useAnalyticsView, type AnalyticsView } from '../hooks/use-analytics-view'
import { countOf, KIND_WORDS } from '../lib/kinds'
import { formatWindow, PRESET_LABELS } from '../lib/ranges'
import { sharesOf } from '../lib/shares'
import type { Kind } from '../types'
import { NotePie } from './note-pie'
import { NoteRows } from './note-rows'
import { RangePicker } from './range-picker'

/**
 * The Analytics page, a tab each for Expenses and Income: what moved in the
 * window, then by note — the note being an entry's type (decided
 * 2026-11-08). Entries with no note are "Others". A split income is one
 * income, at its full amount.
 *
 * Two views of the same figures, the user's pick: a pie with its legend
 * (the default), or the list of rows with a bar of each share. Either way a
 * note opens its own page, which charts it day by day. Shares are whole
 * percentages that add up to exactly 100 (`wholePercents`, the same rule
 * the wallet and allocation breakdowns use).
 *
 * The tab, range and view all live in the URL, so each survives the others
 * changing and a trip to a note's page and back.
 */
export function AnalyticsOverview() {
  const [kind, setKind] = useAnalyticsKind()
  const [range, setRange] = useAnalyticsRange()
  const [view, setView] = useAnalyticsView()
  const { data, isLoading, isError, error, isPlaceholderData } = useNoteTotals(
    kind,
    range.window,
  )

  const words = KIND_WORDS[kind]
  // `keepPreviousData` holds the other tab's figures while this one loads;
  // they're never shown as this tab's.
  const current = data?.kind === kind ? data : undefined
  const shares = sharesOf(current?.notes ?? [])

  return (
    <div className="space-y-4">
      <Tabs value={kind} onValueChange={(value) => setKind(value as Kind)}>
        <TabsList className="h-10! w-full">
          <TabsTrigger value="expense">{KIND_WORDS.expense.tab}</TabsTrigger>
          <TabsTrigger value="income">{KIND_WORDS.income.tab}</TabsTrigger>
        </TabsList>
      </Tabs>

      <section className="rounded-2xl bg-secondary p-5 text-secondary-foreground">
        <p className="text-sm opacity-80">
          {words.verb} · {range.preset === 'custom' ? 'Custom range' : PRESET_LABELS[range.preset]}
        </p>
        <p className="mt-1 text-3xl font-semibold tabular-nums">
          {formatMoney(current?.total ?? 0)}
        </p>
        <p className="mt-1 text-sm opacity-80">
          {formatWindow(range.window)}
          {current && ` · ${countOf(kind, current.count)}`}
        </p>
      </section>

      <RangePicker range={range} onChange={setRange} />

      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold">{words.heading}</h2>
        <Tabs value={view} onValueChange={(value) => setView(value as AnalyticsView)}>
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
            {getApiErrorMessage(error, 'Could not load these figures.')}
          </AlertDescription>
        </Alert>
      ) : isLoading || !current ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : shares.length === 0 ? (
        <EmptyState
          icon={ChartColumn}
          title={kind === 'income' ? 'Nothing received' : 'Nothing spent'}
          description={`${words.tab} in this range show up here, grouped by their note.`}
        />
      ) : (
        <div className={cn('space-y-4 transition-opacity', isPlaceholderData && 'opacity-60')}>
          {view === 'pie' && (
            <section className="rounded-xl border border-border bg-card p-4 text-card-foreground">
              <NotePie shares={shares} />
            </section>
          )}
          <NoteRows
            kind={kind}
            shares={shares}
            range={range}
            variant={view === 'pie' ? 'legend' : 'list'}
          />
        </div>
      )}
    </div>
  )
}
