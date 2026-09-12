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

const centsOf = (amount: string) => Math.round(Number(amount) * 100)

/** How far through a debt you are, 0–100, for the row's bar. */
export function progressOf(debt: Debt): number {
  const owed = centsOf(debt.owed)
  if (owed <= 0) return 100
  return Math.min(100, Math.round((centsOf(debt.paid) / owed) * 100))
}

/**
 * The page's figures, in integer cents: what is still owed across every
 * debt, what has been paid off, and how many are still open.
 */
export function summarize(debts: Debt[]) {
  let remainingCents = 0
  let paidCents = 0
  let open = 0
  for (const debt of debts) {
    paidCents += centsOf(debt.paid)
    if (debt.status === 'open') {
      remainingCents += centsOf(debt.remaining)
      open += 1
    }
  }
  return { remainingCents, paidCents, open }
}
