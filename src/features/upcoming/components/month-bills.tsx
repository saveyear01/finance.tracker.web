import { CalendarCheck } from 'lucide-react'

import { AddCard } from '@/components/add-card'
import { EmptyState } from '@/components/layouts/empty-state'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { localToday } from '@/features/transactions'
import { getApiErrorMessage } from '@/lib/api-client'
import { formatMoney } from '@/lib/money'
import { cn } from '@/lib/utils'

import { useDue } from '../hooks/use-upcoming'
import { monthName, monthTitle, statusOf } from '../lib/upcoming-meta'
import type { Occurrence } from '../types'
import { BillRow } from './bill-row'
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
  const add = <AddCard label="Add new upcoming expense" onClick={onAdd} />
  const later = excludeMonthly && (
    <p className="px-0.5 text-xs text-muted-foreground">
      One-off and yearly bills for the twelve months ahead. The ones that repeat every month are on the month
      tabs.
    </p>
  )

  if (occurrences.length === 0) {
    return (
      <div className="space-y-3">
        {later}
        {add}
        <EmptyState
          icon={CalendarCheck}
          title={spansMonths ? `Nothing due ${spanLabel(month, through)}` : `Nothing due in ${monthName(month)}`}
          description={
            excludeMonthly
              ? 'One-off and yearly bills due after next month show up here.'
              : "Add the bills you know are coming — rent, internet, insurance — and they show up in the month they're due."
          }
        />
      </div>
    )
  }

  const by = (status: string) => occurrences.filter((occurrence) => statusOf(occurrence, today) === status)
  const overdue = by('overdue')
  const coming = occurrences.filter((occurrence) => ['due', 'partial'].includes(statusOf(occurrence, today)))
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
    <div className="space-y-3">
      <section className="card-surface p-4 text-card-foreground" aria-label="Summary">
        <DueSummary
          occurrences={occurrences}
          today={today}
          span={spansMonths ? spanLabel(month, through) : undefined}
        />
      </section>
      {later}
      {add}

      {overdue.length > 0 && <Section title="Overdue" items={overdue} today={today} urgent />}
      {months
        ? months.map(({ key, items }) => (
            <Section key={key} title={monthTitle(key)} items={items} today={today} quiet />
          ))
        : coming.length > 0 && <Section title="Coming up" items={coming} today={today} />}
      {overdue.length + coming.length === 0 && (
        <p className="py-2 text-center text-sm text-muted-foreground">
          {paid.length > 0 ? 'Everything here is paid.' : 'Nothing left to pay here.'}
        </p>
      )}
      {paid.length > 0 && <Section title="Paid" items={paid} today={today} figure="paid" />}
      {skipped.length > 0 && <Section title="Skipped" items={skipped} today={today} figure="none" />}
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
  figure?: 'remaining' | 'paid' | 'none'
}) {
  const cents = items.reduce(
    (sum, occurrence) => sum + (figure === 'paid' ? centsOf(occurrence.paid) : centsOf(occurrence.remaining)),
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
