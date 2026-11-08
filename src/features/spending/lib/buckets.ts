import { format } from 'date-fns'

import type { DaySpending } from '../types'
import { fromIso } from './ranges'

/**
 * Past this many days a bar per day is a hairline on a phone — a year is 365
 * of them — so the chart switches to a bar per month.
 */
const MAX_DAILY_BARS = 62

export type Bucket = {
  key: string
  /** Under the bar: the day of the month, or the month. */
  tick: string
  /** In the tooltip: the whole date, or month and year. */
  title: string
  /** Beside a figure: "Nov 3", or "Nov 2026". */
  short: string
  /** Pesos as a number — recharts plots numbers. Summed in cents first. */
  spent: number
}

/** The days as bars: one per day, or one per month for a long window. */
export function bucketsOf(days: DaySpending[]): { buckets: Bucket[]; monthly: boolean } {
  const monthly = days.length > MAX_DAILY_BARS
  const cents = new Map<string, { date: Date; cents: number }>()
  for (const day of days) {
    const key = monthly ? day.date.slice(0, 7) : day.date
    const bucket = cents.get(key) ?? { date: fromIso(day.date), cents: 0 }
    bucket.cents += Math.round(Number(day.spent) * 100)
    cents.set(key, bucket)
  }

  const buckets = [...cents].map(([key, { date, cents }]) => ({
    key,
    tick: monthly ? format(date, 'MMM') : format(date, 'd'),
    title: monthly ? format(date, 'MMMM yyyy') : format(date, 'EEE, MMM d, yyyy'),
    short: monthly ? format(date, 'MMM yyyy') : format(date, 'MMM d'),
    spent: cents / 100,
  }))
  return { buckets, monthly }
}
