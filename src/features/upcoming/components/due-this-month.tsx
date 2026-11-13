import { useState } from 'react'
import { CalendarClock, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

import { EmptyState } from '@/components/layouts/empty-state'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { localToday } from '@/features/transactions'
import { getApiErrorMessage } from '@/lib/api-client'
import { formatMoney } from '@/lib/money'
import { cn } from '@/lib/utils'

import { useDue, useUpcomingList } from '../hooks/use-upcoming'
import { currentAndNextMonth, statusOf, summarize } from '../lib/upcoming-meta'
import type { Occurrence } from '../types'
import { BillRow } from './bill-row'
import { UpcomingDrawer } from './upcoming-drawer'

const sumRemaining = (occurrences: Occurrence[]) =>
  occurrences.reduce((sum, occurrence) => sum + Math.max(0, Math.round(Number(occurrence.remaining) * 100)), 0)

/**
 * Home's bills (minimal since 2026-11-13, mockup `design/home-minimal.html`):
 * what's left to pay this month — overdue included — as one figure, the
 * overdue count beside it in red, one thin bar (paid / overdue / still to
 * come), then two groups (the user's calls, 2026-11-13): **Overdue** —
 * every overdue bill, oldest first, what needs paying now — and **Budgets**
 * — every budget this month, spent or not, since a budget runs the whole
 * month. Bills still to come stay in the figure and on Upcoming, which the
 * header opens.
 *
 * No pinning any more (removed 2026-11-13, the user's call): Home lists what
 * is owed on its own. No legend and no "more than your balance" paragraph —
 * the red count says there's a problem, Upcoming has the detail. The same
 * query as Upcoming's current tab, so opening it is instant.
 *
 * A household with no bills at all gets an empty state that adds the first
 * one instead. The full list is asked for only when this month is empty, to
 * tell "nothing this month" from "nothing at all".
 */
export function DueThisMonth() {
  const { current } = currentAndNextMonth()
  const today = localToday()
  const due = useDue(current, { carryOverdue: true })
  const nothingThisMonth = due.isSuccess && due.occurrences.length === 0
  const all = useUpcomingList({ enabled: nothingThisMonth })
  const [adding, setAdding] = useState(false)

  if (due.isLoading || (nothingThisMonth && all.isLoading)) {
    return <Skeleton className="h-48 w-full rounded-xl" />
  }

  // Mounted whichever branch draws, so adding the first bill — which swaps
  // the empty state for the card — doesn't cut the drawer's close short.
  const drawer = <UpcomingDrawer open={adding} expense={null} onOpenChange={setAdding} />

  if (nothingThisMonth && all.isSuccess && all.expenses.length === 0) {
    return (
      <>
        <EmptyState
          icon={CalendarClock}
          title="No bills due"
          description="Add rent, internet or insurance and you'll see what's left to pay each month."
          action={
            <Button variant="outline" onClick={() => setAdding(true)}>
              Add upcoming expense
            </Button>
          }
        />
        {drawer}
      </>
    )
  }

  const { toPayCents, overdueCents, paidCents, unpaid, overdue } = summarize(due.occurrences, today)
  const barTotal = paidCents + toPayCents
  const segments = [
    { cents: paidCents, className: 'bg-success' },
    { cents: overdueCents, className: 'bg-destructive' },
    { cents: toPayCents - overdueCents, className: 'bg-(--series-1)' },
  ].filter((segment) => segment.cents > 0)

  // Oldest first — the API's order, soonest due date first.
  const overdueRows = due.occurrences.filter((occurrence) => statusOf(occurrence, today) === 'overdue')
  // This month's budgets, spent or not; an earlier month's has ended.
  const budgets = due.occurrences.filter(
    (occurrence) => occurrence.expense.whole_month && statusOf(occurrence, today) !== 'ended',
  )
  const groups = [
    { title: 'Overdue', items: overdueRows, figure: formatMoney(sumRemaining(overdueRows) / 100), urgent: true },
    { title: 'Budgets', items: budgets, figure: `${formatMoney(sumRemaining(budgets) / 100)} left`, urgent: false },
  ].filter((group) => group.items.length > 0)

  return (
    <>
      <section className="card-surface text-card-foreground" aria-labelledby="due-heading">
        <div className="space-y-2.5 p-4">
          <Link
            to="/upcoming"
            className="-m-1 flex items-center justify-between rounded-md p-1 text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <h2 id="due-heading">Due this month</h2>
            <ChevronRight className="size-4" aria-hidden="true" />
          </Link>

          {due.isError ? (
            <p className="text-sm text-destructive">{getApiErrorMessage(due.error, 'Could not load your bills.')}</p>
          ) : (
            <>
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-2xl font-semibold tracking-tight tabular-nums">{formatMoney(toPayCents / 100)}</p>
                <p className="text-right text-[13px] text-muted-foreground">
                  {due.occurrences.length === 0 ? (
                    'Nothing due'
                  ) : unpaid === 0 ? (
                    'All paid'
                  ) : (
                    <>
                      {overdue > 0 && <b className="font-semibold text-destructive">{overdue} overdue · </b>}
                      {unpaid} to pay
                    </>
                  )}
                </p>
              </div>
              {barTotal > 0 && (
                <div className="flex h-1 gap-0.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                  {segments.map((segment) => (
                    <i
                      key={segment.className}
                      className={cn('block h-full', segment.className)}
                      style={{ width: `${(segment.cents / barTotal) * 100}%` }}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {groups.map((group) => (
          <div key={group.title} className="border-t border-border">
            <h3
              className={cn(
                'flex items-baseline justify-between gap-3 px-4 pt-3 pb-1 text-[11px] font-bold tracking-wider uppercase',
                group.urgent ? 'text-destructive' : 'text-muted-foreground',
              )}
            >
              <span>
                {group.title} · {group.items.length}
              </span>
              <span className="font-medium tracking-normal normal-case tabular-nums">{group.figure}</span>
            </h3>
            <ul>
              {group.items.map((occurrence) => (
                <BillRow key={`${occurrence.expense.id}:${occurrence.due_date}`} occurrence={occurrence} today={today} />
              ))}
            </ul>
          </div>
        ))}
      </section>
      {drawer}
    </>
  )
}
