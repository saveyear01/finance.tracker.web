import { format } from 'date-fns'

import type { DateWindow, Kind } from '../types'

/** The longest window the API reads — a year, leap day included. */
export const MAX_WINDOW_DAYS = 366

/**
 * What the page is looking at (redesigned 2026-11-11): a calendar MONTH or
 * YEAR, stepped back and forth, or a custom from–to. A month or year always
 * runs to its LAST day, not today, so a chart keeps the whole axis and how
 * far through it you are is part of what it shows.
 */
export type PeriodUnit = 'month' | 'year' | 'custom'
export type AnalyticsRange = { unit: PeriodUnit; window: DateWindow }

const pad = (n: number) => String(n).padStart(2, '0')
export const iso = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const ISO_MONTH = /^\d{4}-\d{2}$/
const ISO_YEAR = /^\d{4}$/

/** YYYY-MM-DD → a local Date (never `new Date(iso)`, which is UTC midnight). */
export function fromIso(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/** Days in the window, both ends counted. */
export function daysIn({ start, end }: DateWindow): number {
  return Math.round((fromIso(end).getTime() - fromIso(start).getTime()) / 86_400_000) + 1
}

/** The whole month holding `date`. */
export function monthOf(date: Date): AnalyticsRange {
  const [y, m] = [date.getFullYear(), date.getMonth()]
  return { unit: 'month', window: { start: iso(new Date(y, m, 1)), end: iso(new Date(y, m + 1, 0)) } }
}

/** The whole year holding `date`. */
export function yearOf(date: Date): AnalyticsRange {
  const y = date.getFullYear()
  return { unit: 'year', window: { start: iso(new Date(y, 0, 1)), end: iso(new Date(y, 11, 31)) } }
}

/** One period back (-1) or forward (+1). A custom window shifts by its length. */
export function stepRange(range: AnalyticsRange, direction: -1 | 1): AnalyticsRange {
  const start = fromIso(range.window.start)
  if (range.unit === 'month') return monthOf(new Date(start.getFullYear(), start.getMonth() + direction, 1))
  if (range.unit === 'year') return yearOf(new Date(start.getFullYear() + direction, 0, 1))
  const length = daysIn(range.window)
  const shift = (value: string) => {
    const d = fromIso(value)
    return iso(new Date(d.getFullYear(), d.getMonth(), d.getDate() + direction * length))
  }
  return { unit: 'custom', window: { start: shift(range.window.start), end: shift(range.window.end) } }
}

/** The period before this one — what the hero compares against. */
export const previousRange = (range: AnalyticsRange) => stepRange(range, -1)

/** Forward is allowed while the next period has started by `today`. */
export function canStepForward(range: AnalyticsRange, today: string): boolean {
  return stepRange(range, 1).window.start <= today
}

/**
 * Switching between Month and Year keeps you near what you were looking at:
 * the year holding the month; or, from a year, its month that holds today
 * (this year) or its December (a past year).
 */
export function withUnit(range: AnalyticsRange, unit: 'month' | 'year', today: string): AnalyticsRange {
  const start = fromIso(range.window.start)
  if (unit === 'year') return yearOf(start)
  if (range.unit === 'month') return range
  const now = fromIso(today)
  return start.getFullYear() === now.getFullYear()
    ? monthOf(now)
    : monthOf(new Date(fromIso(range.window.end).getFullYear(), fromIso(range.window.end).getMonth(), 1))
}

/** "September 2026", "2026", or the custom window's dates. */
export function rangeLabel(range: AnalyticsRange): string {
  const start = fromIso(range.window.start)
  if (range.unit === 'month') return format(start, 'MMMM yyyy')
  if (range.unit === 'year') return format(start, 'yyyy')
  return formatWindow(range.window)
}

/** "in September", "in 2026", "Sep 3 – 9" — how the hero names the period. */
export function rangePhrase(range: AnalyticsRange): string {
  const start = fromIso(range.window.start)
  if (range.unit === 'month') return `in ${format(start, 'MMMM')}`
  if (range.unit === 'year') return `in ${format(start, 'yyyy')}`
  return formatWindow(range.window)
}

/** "August", "2025", "the previous 7 days" — what the comparison is against. */
export function previousPhrase(range: AnalyticsRange): string {
  const prev = fromIso(previousRange(range).window.start)
  if (range.unit === 'month') return format(prev, 'MMMM')
  if (range.unit === 'year') return format(prev, 'yyyy')
  return `the previous ${daysIn(range.window)} days`
}

/** Days of the window that have happened by `today` (0 for one still to come). */
export function elapsedDays(window: DateWindow, today: string): number {
  if (today < window.start) return 0
  return daysIn({ start: window.start, end: today < window.end ? today : window.end })
}

/**
 * The range the URL holds, read in the user's own calendar:
 *
 * - `?from=&to=` — a custom window;
 * - `?period=year&at=2026` — a year;
 * - `?at=2026-09` (`period=month` optional) — a month;
 * - nothing — this month.
 *
 * The presets of the first version (`?range=this-month|last-month|last-30|
 * this-year`) still open where they used to, so old links and bookmarks work.
 */
export function rangeFromParams(params: URLSearchParams, now = new Date()): AnalyticsRange {
  const from = params.get('from') ?? ''
  const to = params.get('to') ?? ''
  if (ISO_DATE.test(from) && ISO_DATE.test(to) && from <= to && daysIn({ start: from, end: to }) <= MAX_WINDOW_DAYS) {
    return { unit: 'custom', window: { start: from, end: to } }
  }

  const at = params.get('at') ?? ''
  if (params.get('period') === 'year' && ISO_YEAR.test(at)) return yearOf(new Date(Number(at), 0, 1))
  if (ISO_MONTH.test(at)) {
    const [y, m] = at.split('-').map(Number)
    if (m >= 1 && m <= 12) return monthOf(new Date(y, m - 1, 1))
  }

  switch (params.get('range')) {
    case 'last-month':
      return monthOf(new Date(now.getFullYear(), now.getMonth() - 1, 1))
    case 'last-30':
      return {
        unit: 'custom',
        window: { start: iso(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29)), end: iso(now) },
      }
    case 'this-year':
      return yearOf(now)
    default:
      return monthOf(now)
  }
}

/** The search params that hold a range — what `rangeFromParams` reads. */
export function rangeParams(range: AnalyticsRange, now = new Date()): Record<string, string> {
  const { unit, window } = range
  if (unit === 'custom') return { from: window.start, to: window.end }
  if (unit === 'year') return { period: 'year', at: window.start.slice(0, 4) }
  // This month is the default, so it needs no params.
  return window.start === monthOf(now).window.start ? {} : { at: window.start.slice(0, 7) }
}

/** The search params `rangeParams` may set — cleared before writing new ones. */
export const RANGE_PARAM_KEYS = ['range', 'from', 'to', 'period', 'at'] as const

/** "Nov 1 – 30, 2026", "Oct 10 – Nov 8, 2026", "Dec 20, 2025 – Jan 5, 2026". */
export function formatWindow({ start, end }: DateWindow): string {
  const from = fromIso(start)
  const to = fromIso(end)
  if (start === end) return format(from, 'MMM d, yyyy')
  if (from.getFullYear() !== to.getFullYear()) {
    return `${format(from, 'MMM d, yyyy')} – ${format(to, 'MMM d, yyyy')}`
  }
  if (from.getMonth() !== to.getMonth()) {
    return `${format(from, 'MMM d')} – ${format(to, 'MMM d, yyyy')}`
  }
  return `${format(from, 'MMM d')} – ${format(to, 'd, yyyy')}`
}

/** What a group is called — the note, or "Others" for entries without one. */
export function noteLabel(note: string | null): string {
  return note ?? 'Others'
}

/**
 * The link to one note's page, carrying the tab and the range along. No
 * `note` param is the no-note group.
 */
export function notePath(kind: Kind, note: string | null, range: AnalyticsRange): string {
  const params = new URLSearchParams({
    ...(kind === 'income' && { tab: kind }),
    ...(note !== null && { note }),
    ...rangeParams(range),
  })
  const query = params.toString()
  return `/analytics/note${query ? `?${query}` : ''}`
}
