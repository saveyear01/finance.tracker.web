import { useState } from 'react'
import { CalendarClock, ChevronRight } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

import { EmptyState } from '@/components/layouts/empty-state'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { localToday } from '@/features/transactions'
import { getApiErrorMessage } from '@/lib/api-client'
import { formatMoney } from '@/lib/money'
import { cn } from '@/lib/utils'

import { useDue, useUpcomingList } from '../hooks/use-upcoming'
import { currentAndNextMonth, daysBetween, shortDate, statusOf, summarize } from '../lib/upcoming-meta'
import type { Occurrence } from '../types'
import { UpcomingDrawer } from './upcoming-drawer'

const centsOf = (amount: string) => Math.round(Number(amount) * 100)

/**
 * One line of Home's card (option A of `design/due-card-minimal.html`, the
 * user's pick, 2026-11-13) — lighter than Upcoming's `BillRow`: a small dot
 * instead of a date tile, red said once, no chevron.
 *
 * - an overdue bill: red dot, the name over its due date, what's left over
 *   "43 days late";
 * - a budget: teal dot, the name over a thin bar of what's been spent, what's
 *   left over "left" ("over budget" in red once it has gone past).
 *
 * The row opens that due date's own page, as Upcoming's rows do.
 */
function DueRow({ occurrence, today }: { occurrence: Occurrence; today: string }) {
  const { pathname } = useLocation()
  const { expense } = occurrence
  const budget = expense.whole_month
  const remaining = centsOf(occurrence.remaining)
  const amount = centsOf(expense.amount)
  const spent = amount > 0 ? Math.min(100, (centsOf(occurrence.paid) / amount) * 100) : 0
  const late = -daysBetween(today, occurrence.due_date)

  return (
    <li className="border-border not-first:border-t">
      <Link
        to={`/upcoming/${expense.id}/${occurrence.due_date}`}
        state={{ from: pathname }}
        className="grid grid-cols-[0.5rem_minmax(0,1fr)_auto] items-center gap-3 px-4 py-2.5 transition-colors outline-none hover:bg-muted/60 focus-visible:bg-muted/60 active:bg-muted"
      >
        <span className={cn('size-2 rounded-full', budget ? 'bg-primary' : 'bg-destructive')} aria-hidden="true" />
        <span className="min-w-0">
          <span className="block truncate font-medium">{expense.name}</span>
          {budget ? (
            <span className="mt-1.5 block h-[3px] w-28 overflow-hidden rounded-full bg-muted">
              <span className="block h-full rounded-full bg-primary" style={{ width: `${spent}%` }} />
              <span className="sr-only">{Math.round(spent)}% spent</span>
            </span>
          ) : (
            <span className="block text-xs text-muted-foreground">{shortDate(occurrence.due_date)}</span>
          )}
        </span>
        <span className="text-right">
          <span className="block font-semibold tabular-nums">{formatMoney(Math.abs(remaining) / 100)}</span>
          <span
            className={cn(
              'block text-xs',
              budget && remaining >= 0 ? 'text-muted-foreground' : 'text-destructive',
            )}
          >
            {budget
              ? remaining < 0
                ? 'over budget'
                : 'left'
              : `${late} ${late === 1 ? 'day' : 'days'} late`}
          </span>
        </span>
      </Link>
    </li>
  )
}

/**
 * Home's bills (minimal since 2026-11-13, mockup `design/home-minimal.html`):
 * what's left to pay this month — overdue included — as one figure, the
 * overdue count beside it in red, one thin bar (paid / overdue / still to
 * come), then two groups (the user's calls, 2026-11-13): **Overdue** —
 * every overdue bill, oldest first, what needs paying now — and **Budgets**
 * — every budget this month, spent or not, since a budget runs the whole
 * month — in `DueRow`s (option A of `design/due-card-minimal.html`). Each
 * group's heading opens that section of Upcoming (`/upcoming#overdue`,
 * `#budgets`). Bills still to come stay in the figure and on Upcoming,
 * which the header opens.
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
    { title: 'Overdue', anchor: 'overdue', items: overdueRows },
    { title: 'Budgets', anchor: 'budgets', items: budgets },
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
              <div>
                <p className="text-2xl font-semibold tracking-tight tabular-nums">{formatMoney(toPayCents / 100)}</p>
                <p className="text-[13px] text-muted-foreground">
                  {due.occurrences.length === 0 ? (
                    'Nothing due'
                  ) : unpaid === 0 ? (
                    'All paid'
                  ) : (
                    <>
                      {overdue > 0 && (
                        <b className="font-semibold text-destructive">{formatMoney(overdueCents / 100)} overdue · </b>
                      )}
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
            <h3>
              <Link
                to={`/upcoming#${group.anchor}`}
                className="block px-4 pt-3 pb-1 text-[11px] font-bold tracking-wider text-muted-foreground uppercase outline-none hover:text-foreground focus-visible:text-foreground"
              >
                {group.title} · {group.items.length}
              </Link>
            </h3>
            <ul>
              {group.items.map((occurrence) => (
                <DueRow key={`${occurrence.expense.id}:${occurrence.due_date}`} occurrence={occurrence} today={today} />
              ))}
            </ul>
          </div>
        ))}
      </section>
      {drawer}
    </>
  )
}
