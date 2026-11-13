import type { Occurrence, Recurrence } from '../types'

export const RECURRENCE_LABELS: Record<Recurrence, string> = {
  none: "Doesn't repeat",
  monthly: 'Every month',
  yearly: 'Every year',
}

/** Short form for a row: "Monthly", "Yearly", or nothing for a one-off. */
export const RECURRENCE_BADGES: Record<Recurrence, string | null> = {
  none: null,
  monthly: 'Monthly',
  yearly: 'Yearly',
}

const pad = (n: number) => String(n).padStart(2, '0')

/** "2026-09" for a date in the user's own timezone. */
export function monthKeyOf(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`
}

/** This month and next, as the user's calendar has them. */
export function currentAndNextMonth(now = new Date()): { current: string; next: string } {
  return {
    current: monthKeyOf(now),
    next: monthKeyOf(new Date(now.getFullYear(), now.getMonth() + 1, 1)),
  }
}

/**
 * The "later" window: the months after next, up to this month next year —
 * with the two month tabs, a year ahead in all (decided 2026-11-11).
 *
 * It used to stop at December 31, which left the tab empty every November
 * and December, exactly when next year's yearly bills come into view.
 */
export function laterWindow(now = new Date()): { from: string; through: string } {
  return {
    from: monthKeyOf(new Date(now.getFullYear(), now.getMonth() + 2, 1)),
    through: monthKeyOf(new Date(now.getFullYear() + 1, now.getMonth(), 1)),
  }
}

/** "2026-09" → "September 2026", always with the year. */
export function monthTitle(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number)
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

/** "2026-09" → "September", with the year only when it isn't this year. */
export function monthName(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number)
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', {
    month: 'long',
    ...(year !== new Date().getFullYear() && { year: 'numeric' }),
  })
}

/** "Sep 15" from YYYY-MM-DD, parsed as a local date. */
export function shortDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(year !== new Date().getFullYear() && { year: 'numeric' }),
  })
}

/** How a row reads: the API's status, with "overdue" split out of the owed
 * ones by the user's own today — and, for a budget, "ended" once its month
 * is over (a budget is never overdue: it just ends, spent or not). */
export type RowStatus = 'paid' | 'skipped' | 'overdue' | 'partial' | 'due' | 'ended'

/** Owed: unpaid or partly paid — what Pay and (when overdue) Skip act on. */
export function isOwed(occurrence: Occurrence): boolean {
  return occurrence.status === 'unpaid' || occurrence.status === 'partial'
}

/** The last day of a due date's month, YYYY-MM-DD — when a budget ends. */
export function monthEndOf(isoDate: string): string {
  const [year, month] = isoDate.split('-').map(Number)
  return `${isoDate.slice(0, 7)}-${pad(new Date(year, month, 0).getDate())}`
}

export function statusOf(occurrence: Occurrence, today: string): RowStatus {
  if (occurrence.status === 'paid' || occurrence.status === 'skipped') return occurrence.status
  if (occurrence.expense.whole_month) {
    if (monthEndOf(occurrence.due_date) < today) return 'ended'
    return occurrence.status === 'partial' ? 'partial' : 'due'
  }
  if (occurrence.due_date < today) return 'overdue'
  return occurrence.status === 'partial' ? 'partial' : 'due'
}

const centsOf = (amount: string) => Math.round(Number(amount) * 100)

/**
 * A month's figures, in integer cents: what's still to pay (what's left of
 * every owed bill, overdue included — `overdueCents` of it already late),
 * what was paid (partial payments too), and how many are owed / overdue /
 * paid in full.
 */
export function summarize(occurrences: Occurrence[], today: string) {
  let toPayCents = 0
  let overdueCents = 0
  let paidCents = 0
  let unpaid = 0
  let overdue = 0
  let paid = 0
  for (const occurrence of occurrences) {
    paidCents += centsOf(occurrence.paid)
    if (occurrence.status === 'paid') paid += 1
    const status = statusOf(occurrence, today)
    // What's left of a budget counts like an unpaid bill — never as late, and
    // not at all once its month has ended.
    if (isOwed(occurrence) && status !== 'ended') {
      toPayCents += centsOf(occurrence.remaining)
      unpaid += 1
      if (status === 'overdue') {
        overdue += 1
        overdueCents += centsOf(occurrence.remaining)
      }
    }
  }
  return { toPayCents, overdueCents, paidCents, unpaid, overdue, paid }
}

/** Whole days from `from` to `to` (YYYY-MM-DD), counted in UTC so a DST
 * change never makes a day 23 hours. */
export function daysBetween(from: string, to: string): number {
  const utc = (value: string) => {
    const [y, m, d] = value.split('-').map(Number)
    return Date.UTC(y, m - 1, d)
  }
  return Math.round((utc(to) - utc(from)) / 86_400_000)
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

/**
 * Where a due date stands, in words and in days — "23 days overdue", "Due in
 * 8 days", "Paid Sep 18". What a row's second line and the due date's page
 * both say, so the two never disagree.
 */
export function whenText(occurrence: Occurrence, today: string): string {
  if (occurrence.expense.whole_month) return budgetText(occurrence, today)
  const status = statusOf(occurrence, today)
  const days = daysBetween(today, occurrence.due_date)
  const over = status === 'paid' && Number(occurrence.remaining) < 0
  switch (status) {
    case 'overdue':
      return `${plural(-days, 'day')} overdue`
    case 'paid':
      return over ? 'Over budget' : `Paid ${shortDate(occurrence.payments.at(-1)?.paid_on ?? occurrence.due_date)}`
    case 'skipped':
      return 'Skipped'
    case 'ended':
      return 'Ended'
    case 'partial':
      return `Part paid · due ${days === 0 ? 'today' : `in ${plural(days, 'day')}`}`
    case 'due':
      return days === 0 ? 'Due today' : days === 1 ? 'Due tomorrow' : `Due in ${days} days`
  }
}

/**
 * A budget's line: how long its month has left, not a day it's due — "17
 * days left", "Starts Dec 1", "Over budget", "Ended".
 */
function budgetText(occurrence: Occurrence, today: string): string {
  const status = statusOf(occurrence, today)
  const left = daysBetween(today, monthEndOf(occurrence.due_date))
  const timeLeft =
    occurrence.due_date > today
      ? `Starts ${shortDate(occurrence.due_date)}`
      : left === 0
        ? 'Ends today'
        : `${plural(left, 'day')} left`
  switch (status) {
    case 'paid':
      return Number(occurrence.remaining) < 0 ? 'Over budget' : 'All spent'
    case 'skipped':
      return 'Skipped'
    case 'ended':
      return 'Ended'
    case 'partial':
      return `Part spent · ${timeLeft.charAt(0).toLowerCase()}${timeLeft.slice(1)}`
    default:
      return timeLeft
  }
}
