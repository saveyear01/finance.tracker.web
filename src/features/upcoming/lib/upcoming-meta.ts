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
 * The "later" window: everything after next month, to the end of THIS year.
 *
 * Deliberately stops at the year's end rather than running on for twelve
 * months — a year is how people think about what is still to come, and it
 * keeps the tab from filling with dates that are barely decided yet.
 *
 * From November the window is empty, because "after next month" is already
 * next year by then. `empty` says so rather than leaving the caller to
 * compare month strings.
 */
export function laterWindow(now = new Date()): { from: string; through: string; empty: boolean } {
  const from = monthKeyOf(new Date(now.getFullYear(), now.getMonth() + 2, 1))
  const through = `${now.getFullYear()}-12`
  return { from, through, empty: from > through }
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
 * ones by the user's own today. */
export type RowStatus = 'paid' | 'skipped' | 'overdue' | 'partial' | 'due'

/** Owed: unpaid or partly paid — what Pay and (when overdue) Skip act on. */
export function isOwed(occurrence: Occurrence): boolean {
  return occurrence.status === 'unpaid' || occurrence.status === 'partial'
}

export function statusOf(occurrence: Occurrence, today: string): RowStatus {
  if (occurrence.status === 'paid' || occurrence.status === 'skipped') return occurrence.status
  if (occurrence.due_date < today) return 'overdue'
  return occurrence.status === 'partial' ? 'partial' : 'due'
}

const centsOf = (amount: string) => Math.round(Number(amount) * 100)

/**
 * A month's figures, in integer cents: what's still to pay (what's left of
 * every owed bill, overdue included), what was paid (partial payments too),
 * and how many are owed / overdue.
 */
export function summarize(occurrences: Occurrence[], today: string) {
  let toPayCents = 0
  let paidCents = 0
  let unpaid = 0
  let overdue = 0
  for (const occurrence of occurrences) {
    paidCents += centsOf(occurrence.paid)
    if (isOwed(occurrence)) {
      toPayCents += centsOf(occurrence.remaining)
      unpaid += 1
      if (occurrence.due_date < today) overdue += 1
    }
  }
  return { toPayCents, paidCents, unpaid, overdue }
}
