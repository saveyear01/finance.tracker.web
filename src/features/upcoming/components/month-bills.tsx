import { CalendarCheck } from 'lucide-react'
import type { ReactNode } from 'react'

import { AddCard } from '@/components/add-card'
import { EmptyState } from '@/components/layouts/empty-state'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { localToday } from '@/features/transactions'
import { useIsCompact } from '@/hooks/use-compact'
import { getApiErrorMessage } from '@/lib/api-client'
import { formatMoney } from '@/lib/money'
import { cn } from '@/lib/utils'

import { useDue } from '../hooks/use-upcoming'
import { monthName, monthTitle, statusOf } from '../lib/upcoming-meta'
import type { Occurrence } from '../types'
import { BillRow } from './bill-row'
import { BillsCalendar } from './bills-calendar'
import { DueSummary } from './due-summary'

const centsOf = (amount: string) => Math.round(Number(amount) * 100)
const keyOf = (occurrence: Occurrence) => `${occurrence.expense.id}:${occurrence.due_date}`

/** "Jan – Nov 2027", or "Dec 2026 – Nov 2027" across a year end. */
function spanLabel(from: string, through: string): string {
  const short = (key: string, year: boolean) => {
    const [y, m] = key.split('-').map(Number)
    return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'short', ...(year && { year: 'numeric' }) })
  }
  return from.slice(0, 4) === through.slice(0, 4)
    ? `${short(from, false)} – ${short(through, true)}`
    : `${short(from, true)} – ${short(through, true)}`
}

/**
 * A window's bills (redesigned 2026-11-11): the summary — what's left, and a
 * bar split into paid / overdue / later — then the due dates in sections, so
 * what needs doing reads apart from what doesn't:
 *
 * - **Overdue**, red, first (the current month carries earlier unpaid ones in
 *   with `carryOverdue`);
 * - **Budgets** (2026-11-13): the month's whole-month budgets, spent or not —
 *   they have no day, so they neither fall due nor drop down to Paid; its
 *   figure is what's left unspent. On the Later tab they sit under their month;
 * - **Coming up** — on the Later tab, under a heading per month instead;
 * - **Paid**, then **Skipped** (decided 2026-09-24): what's done, or waved
 *   off, doesn't pad out what's left. A skip made this month stays here with
 *   its undo on the bill's page.
 *
 * Usually one month. With `through` it spans several — the Later tab — and
 * with `excludeMonthly` the bills that repeat every month are left out, since
 * over a long window they would crowd out the one-offs that are the reason to
 * look ahead. That omission is said out loud above the list.
 *
 * Rows are links: paying, skipping, editing and deleting all live on the due
 * date's own page.
 *
 * From lg (design/large-screen.html): the summary runs across the page, then
 * the sections on the left and the month as a calendar on the right. Adding
 * moves to the toolbar's button, so the dashed card is a phone's only. The
 * Later tab has no calendar — a year is too long for one grid — so its month
 * sections pair up in two columns instead. An empty month keeps the summary
 * at zero and the calendar, with the empty state (and a button to add one)
 * in the list's place.
 */
export function MonthBills({
  month,
  through,
  carryOverdue = false,
  excludeMonthly = false,
  onAdd,
}: {
  /** YYYY-MM — the window's first month. */
  month: string
  /** YYYY-MM — its last, when the window is more than one month. */
  through?: string
  carryOverdue?: boolean
  excludeMonthly?: boolean
  onAdd: () => void
}) {
  const { occurrences, isLoading, isError, error } = useDue(month, {
    through,
    carryOverdue,
    excludeMonthly,
  })
  const today = localToday()
  const spansMonths = through !== undefined
  const compact = useIsCompact()

  if (isLoading) {
    return (
      <div className="space-y-3" aria-hidden="true">
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    )
  }
  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {getApiErrorMessage(error, 'Could not load your upcoming expenses.')}
        </AlertDescription>
      </Alert>
    )
  }
  const add = <AddCard label="Add new upcoming expense" onClick={onAdd} className="lg:hidden" />
  const later = excludeMonthly && (
    <p className="px-0.5 text-xs text-muted-foreground">
      One-off and yearly bills for the twelve months ahead. The ones that repeat every month are on the month
      tabs.
    </p>
  )
  const summary = (
    <section
      className={cn('card-surface p-4 text-card-foreground lg:px-5', occurrences.length === 0 && 'hidden lg:block')}
      aria-label="Summary"
    >
      <DueSummary
        occurrences={occurrences}
        today={today}
        span={spansMonths ? spanLabel(month, through) : undefined}
        wide
      />
    </section>
  )
  // Hidden rather than unmounted below lg: the same tree either way, so a
  // window dragged across the breakpoint doesn't refetch or lose its place.
  const calendar = !spansMonths && (
    <div className="hidden lg:block">
      <BillsCalendar month={month} occurrences={occurrences} today={today} />
    </div>
  )
  const columns = (list: ReactNode) =>
    spansMonths ? (
      list
    ) : (
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] lg:items-start lg:gap-6">
        {list}
        {calendar}
      </div>
    )

  if (occurrences.length === 0) {
    return (
      <div className="space-y-3 lg:space-y-4">
        {summary}
        {later}
        {add}
        {columns(
          <EmptyState
            icon={CalendarCheck}
            title={spansMonths ? `Nothing due ${spanLabel(month, through)}` : `Nothing due in ${monthName(month)}`}
            description={
              excludeMonthly
                ? 'One-off and yearly bills due after next month show up here.'
                : "Add the bills you know are coming — rent, internet, insurance — and they show up in the month they're due."
            }
            // A phone has the dashed card right above it.
            action={!compact && <Button onClick={onAdd}>Add upcoming expense</Button>}
          />,
        )}
      </div>
    )
  }

  // A month's budgets have no day, so on a month tab they are a section of
  // their own at the top, spent or not. On the Later tab they fall under
  // their month like any other entry.
  const budgets = spansMonths ? [] : occurrences.filter((occurrence) => occurrence.expense.whole_month)
  const dated = spansMonths ? occurrences : occurrences.filter((occurrence) => !occurrence.expense.whole_month)
  const by = (status: string) => dated.filter((occurrence) => statusOf(occurrence, today) === status)
  const overdue = by('overdue')
  const coming = dated.filter((occurrence) => ['due', 'partial'].includes(statusOf(occurrence, today)))
  const paid = by('paid')
  const skipped = by('skipped')

  // On the Later tab, what's coming is grouped by month — a year ahead is
  // too long to read as one run.
  const months = spansMonths
    ? [...new Set(coming.map((occurrence) => occurrence.due_date.slice(0, 7)))].map((key) => ({
        key,
        items: coming.filter((occurrence) => occurrence.due_date.startsWith(key)),
      }))
    : null

  return (
    <div className="space-y-3 lg:space-y-4">
      {summary}
      {later}
      {add}

      {columns(
        <div
          className={cn(
            'space-y-3',
            spansMonths && 'lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-6 lg:gap-y-4 lg:space-y-0',
          )}
        >
          {overdue.length > 0 && <Section title="Overdue" items={overdue} today={today} urgent />}
          {budgets.length > 0 && <Section title="Budgets" items={budgets} today={today} figure="left" />}
          {months
            ? months.map(({ key, items }) => (
                <Section key={key} title={monthTitle(key)} items={items} today={today} quiet />
              ))
            : coming.length > 0 && <Section title="Coming up" items={coming} today={today} />}
          {overdue.length + coming.length === 0 && dated.length > 0 && (
            <p className="py-2 text-center text-sm text-muted-foreground lg:col-span-2">
              {paid.length > 0 ? 'Everything here is paid.' : 'Nothing left to pay here.'}
            </p>
          )}
          {paid.length > 0 && <Section title="Paid" items={paid} today={today} figure="paid" />}
          {skipped.length > 0 && <Section title="Skipped" items={skipped} today={today} figure="none" />}
        </div>,
      )}
    </div>
  )
}

/**
 * One section: a heading with its count and what it comes to, then its rows
 * in one list card. `quiet` is the Later tab's month heading — small caps,
 * no count — since the months themselves are the structure there.
 */
function Section({
  title,
  items,
  today,
  urgent = false,
  quiet = false,
  figure = 'remaining',
}: {
  title: string
  items: Occurrence[]
  today: string
  urgent?: boolean
  quiet?: boolean
  /** `left`: what's still unspent — an overspent budget adds nothing, rather
   * than eating into the others'. */
  figure?: 'remaining' | 'paid' | 'left' | 'none'
}) {
  const cents = items.reduce(
    (sum, occurrence) =>
      sum +
      (figure === 'paid'
        ? centsOf(occurrence.paid)
        : figure === 'left'
          ? Math.max(0, centsOf(occurrence.remaining))
          : centsOf(occurrence.remaining)),
    0,
  )

  return (
    <section className="space-y-2">
      <h2 className="flex items-baseline justify-between gap-3 px-0.5">
        <span
          className={cn(
            quiet
              ? 'text-[11px] font-bold tracking-wider text-muted-foreground uppercase'
              : 'text-sm font-semibold',
            urgent && 'text-destructive',
          )}
        >
          {title}
          {!quiet && ` · ${items.length}`}
        </span>
        {figure !== 'none' && !quiet && (
          <span className="text-xs text-muted-foreground tabular-nums">{formatMoney(cents / 100)}</span>
        )}
      </h2>
      <ul className="overflow-hidden card-surface text-card-foreground">
        {items.map((occurrence) => (
          <BillRow key={keyOf(occurrence)} occurrence={occurrence} today={today} showPin />
        ))}
      </ul>
    </section>
  )
}
