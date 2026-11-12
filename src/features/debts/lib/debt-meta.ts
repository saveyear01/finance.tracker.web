import { formatMoney } from '@/lib/money'

import type { Debt, RateKind } from '../types'

export const RATE_KIND_LABELS: Record<RateKind, string> = {
  fixed: 'Fixed rate',
  variable: 'Variable rate',
}

/** Short form for a row: a fixed debt just shows its rate, so only a
 * variable one needs saying. */
export const RATE_KIND_BADGES: Record<RateKind, string | null> = {
  fixed: null,
  variable: 'Variable',
}

/** "1.250" → "1.25%/mo" — trailing zeros are noise on a rate, and the unit
 * matters: this is per month, not per year. */
export function formatRate(rate: string | null): string | null {
  if (rate === null) return null
  return `${Number(rate)}%/mo`
}

/** "36 months", "1 month", "2 years" — a round number of years reads better
 * as years, which is how a loan's term is usually spoken about. */
export function formatTerm(months: number | null): string | null {
  if (months === null) return null
  if (months >= 12 && months % 12 === 0) {
    const years = months / 12
    return `${years} ${years === 1 ? 'year' : 'years'}`
  }
  return `${months} ${months === 1 ? 'month' : 'months'}`
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

/** "Mar 1, 2025" — always with the year, for dates that may be far off. */
export function longDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export const centsOf = (amount: string) => Math.round(Number(amount) * 100)

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`

/**
 * What a month of the debt costs, and what to call it: the term's own
 * payment where there is one, else the lender's minimum. Null for a debt
 * with neither — money owed to a friend, say.
 */
export function monthlyCost(debt: Debt): { amount: string; label: string } | null {
  if (debt.monthly_payment) return { amount: debt.monthly_payment, label: 'a month' }
  if (debt.minimum_payment) return { amount: debt.minimum_payment, label: 'minimum' }
  return null
}

export type Standing = { tone: 'bad' | 'good' | 'neutral'; label: string }

/**
 * Where an open debt stands, in a few words: against its schedule when it
 * has a term ("19 payments behind", "On track", "2 payments ahead"), else
 * that it has no end date. Whole payments when the gap is at least one, the
 * amount when it's less — "₱400.00 behind" is truer than "0 payments".
 */
export function standingOf(debt: Debt): Standing {
  const { schedule, monthly_payment: monthly } = debt
  if (!schedule || !monthly) return { tone: 'neutral', label: 'No end date' }
  const monthlyCents = centsOf(monthly)
  const behind = centsOf(schedule.behind)
  const ahead = centsOf(schedule.ahead)
  if (behind > 0) {
    const count = Math.floor(behind / monthlyCents)
    return {
      tone: 'bad',
      label: count >= 1 ? `${plural(count, 'payment')} behind` : `${formatMoney(schedule.behind)} behind`,
    }
  }
  const count = Math.floor(ahead / monthlyCents)
  if (count >= 1) return { tone: 'good', label: `${plural(count, 'payment')} ahead` }
  if (schedule.due_count === 0 && schedule.next_due) {
    return { tone: 'neutral', label: `First due ${shortDate(schedule.next_due)}` }
  }
  return { tone: 'good', label: 'On track' }
}

/** Ways to rank debts, for the order editor's one-tap presets. */
export type OrderPreset = 'rate' | 'balance'

export const ORDER_PRESETS: { value: OrderPreset; label: string; hint: string }[] = [
  { value: 'rate', label: 'Highest rate first', hint: 'saves the most interest' },
  { value: 'balance', label: 'Smallest balance first', hint: 'clears a debt soonest' },
]

const rateOf = (debt: Debt) => Number(debt.current_rate ?? 0)

/**
 * The open debts ranked by a preset. Highest rate (the "avalanche"): the
 * rate in force, an interest-free debt last, then the smaller balance first.
 * Smallest balance (the "snowball"): what's left, then the higher rate.
 */
export function rankBy(debts: Debt[], preset: OrderPreset): Debt[] {
  const left = (debt: Debt) => centsOf(debt.remaining)
  return [...debts].sort((a, b) =>
    preset === 'rate'
      ? rateOf(b) - rateOf(a) || left(a) - left(b)
      : left(a) - left(b) || rateOf(b) - rateOf(a),
  )
}

/** A YYYY-MM-DD date `months` on from `isoDate`, as "Jun 2028". */
export function monthYearAfter(isoDate: string, months: number): string {
  const [year, month] = isoDate.split('-').map(Number)
  return new Date(year, month - 1 + months, 1).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  })
}

/**
 * An open-ended debt's pace: how many months its minimum takes to clear
 * what's left (null without a minimum), and what was paid in the last
 * three months — the honest "how fast is this going" for a debt with no
 * schedule to measure against.
 */
export function paceOf(debt: Debt, today: string) {
  const left = centsOf(debt.remaining)
  const minimum = debt.minimum_payment ? centsOf(debt.minimum_payment) : 0
  const [year, month, day] = today.split('-').map(Number)
  const since = new Date(year, month - 4, day)
  const recentCents = debt.payments
    .filter((payment) => {
      const [y, m, d] = payment.paid_on.split('-').map(Number)
      return new Date(y, m - 1, d) > since
    })
    .reduce((sum, payment) => sum + centsOf(payment.amount), 0)
  return {
    monthsAtMinimum: minimum > 0 && left > 0 ? Math.ceil(left / minimum) : null,
    recentCents,
  }
}

/** How far through a debt you are, 0–100, for the row's bar. */
export function progressOf(debt: Debt): number {
  const owed = centsOf(debt.owed)
  if (owed <= 0) return 100
  return Math.min(100, Math.round((centsOf(debt.paid) / owed) * 100))
}

/**
 * The page's figures, in integer cents: what is still owed across every
 * debt, what a month of the open ones costs, what has been paid against
 * everything they came to, and how many are open / paid off.
 */
export function summarize(debts: Debt[]) {
  let remainingCents = 0
  let monthlyCents = 0
  let paidCents = 0
  let owedCents = 0
  let paidOffCents = 0
  let open = 0
  for (const debt of debts) {
    paidCents += centsOf(debt.paid)
    owedCents += centsOf(debt.owed)
    if (debt.status === 'open') {
      remainingCents += centsOf(debt.remaining)
      const cost = monthlyCost(debt)
      if (cost) monthlyCents += centsOf(cost.amount)
      open += 1
    } else {
      paidOffCents += centsOf(debt.paid)
    }
  }
  const progress =
    owedCents <= 0 ? 0 : Math.min(100, Math.round((paidCents / owedCents) * 100))
  return {
    remainingCents,
    monthlyCents,
    paidCents,
    owedCents,
    paidOffCents,
    progress,
    open,
    paidOff: debts.length - open,
  }
}
