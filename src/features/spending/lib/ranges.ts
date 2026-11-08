import { format } from 'date-fns'

import type { DateWindow } from '../types'

export const PRESETS = ['this-month', 'last-month', 'last-30', 'this-year', 'custom'] as const
export type RangePreset = (typeof PRESETS)[number]

export const PRESET_LABELS: Record<RangePreset, string> = {
  'this-month': 'This month',
  'last-month': 'Last month',
  'last-30': 'Last 30 days',
  'this-year': 'This year',
  custom: 'Custom range',
}

/** The longest window the API reads — a year, leap day included. */
export const MAX_WINDOW_DAYS = 366

export type SpendingRange = { preset: RangePreset; window: DateWindow }

const pad = (n: number) => String(n).padStart(2, '0')
const iso = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/** YYYY-MM-DD → a local Date (never `new Date(iso)`, which is UTC midnight). */
export function fromIso(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/** Days in the window, both ends counted. */
export function daysIn({ start, end }: DateWindow): number {
  return Math.round((fromIso(end).getTime() - fromIso(start).getTime()) / 86_400_000) + 1
}

/**
 * The days a preset covers, in the user's own calendar. Month and year
 * presets run to their LAST day, not today: the chart keeps the whole month's
 * axis, so how far through it you are is part of what it shows.
 */
export function windowOf(preset: Exclude<RangePreset, 'custom'>, now = new Date()): DateWindow {
  const y = now.getFullYear()
  const m = now.getMonth()
  switch (preset) {
    case 'this-month':
      return { start: iso(new Date(y, m, 1)), end: iso(new Date(y, m + 1, 0)) }
    case 'last-month':
      return { start: iso(new Date(y, m - 1, 1)), end: iso(new Date(y, m, 0)) }
    case 'last-30':
      return { start: iso(new Date(y, m, now.getDate() - 29)), end: iso(now) }
    case 'this-year':
      return { start: iso(new Date(y, 0, 1)), end: iso(new Date(y, 11, 31)) }
  }
}

/**
 * The range the URL holds: `?from=&to=` for a custom one, `?range=` for a
 * preset, this month otherwise. Lives in the URL so opening a note and
 * coming back lands on the same range, and a reload keeps it.
 */
export function rangeFromParams(params: URLSearchParams): SpendingRange {
  const from = params.get('from') ?? ''
  const to = params.get('to') ?? ''
  if (ISO_DATE.test(from) && ISO_DATE.test(to) && from <= to) {
    return { preset: 'custom', window: { start: from, end: to } }
  }

  const preset = params.get('range') as RangePreset | null
  const known = preset && preset !== 'custom' && PRESETS.includes(preset) ? preset : 'this-month'
  return { preset: known, window: windowOf(known) }
}

/** The search params that hold a range — what `rangeFromParams` reads. */
export function rangeParams({ preset, window }: SpendingRange): Record<string, string> {
  if (preset === 'custom') return { from: window.start, to: window.end }
  return preset === 'this-month' ? {} : { range: preset }
}

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

/** What a group is called — the note, or "Others" for expenses without one. */
export function noteLabel(note: string | null): string {
  return note ?? 'Others'
}

/**
 * The link to one note's page, carrying the range along. No `note` param is
 * the no-note group.
 */
export function notePath(note: string | null, range: SpendingRange): string {
  const params = new URLSearchParams({ ...(note !== null && { note }), ...rangeParams(range) })
  const query = params.toString()
  return `/analytics/note${query ? `?${query}` : ''}`
}
