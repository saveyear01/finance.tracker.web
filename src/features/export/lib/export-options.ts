import { format } from 'date-fns'

/** The periods offered, as chips. Custom shows the two date pickers. */
export type ExportPeriod = 'month' | 'last-month' | 'year' | 'all' | 'custom'

export const PERIOD_OPTIONS: { value: ExportPeriod; label: string }[] = [
  { value: 'month', label: 'This month' },
  { value: 'last-month', label: 'Last month' },
  { value: 'year', label: 'This year' },
  { value: 'all', label: 'All time' },
  { value: 'custom', label: 'Custom' },
]

/** What can go in an export — the API's `include` values. */
export type ExportPart = 'transactions' | 'balances' | 'upcoming' | 'debts' | 'setup'

export const PARTS: {
  value: ExportPart
  label: string
  description: string
  /** Not limited by the period. */
  allTime?: boolean
}[] = [
  {
    value: 'transactions',
    label: 'Transactions',
    description: 'Every entry: income, expenses, moves, transfers',
  },
  {
    value: 'balances',
    label: 'Balances',
    description: 'Each wallet × allocation on the end date',
  },
  {
    value: 'upcoming',
    label: 'Upcoming expenses',
    description: 'Bills due in the period and what was paid',
  },
  {
    value: 'debts',
    label: 'Debts',
    description: 'Each debt as it stands, with its payments and charges',
  },
  {
    value: 'setup',
    label: 'Wallets & allocations',
    description: 'Names, types, income split %',
    allTime: true,
  },
]

export const DEFAULT_PARTS: ExportPart[] = ['transactions', 'balances']

export type ExportFormat = 'csv' | 'xlsx'

export const FORMAT_OPTIONS: { value: ExportFormat; label: string }[] = [
  { value: 'csv', label: 'CSV' },
  { value: 'xlsx', label: 'Excel' },
]

/** `start` null: from the first entry. Both YYYY-MM-DD. */
export type ExportWindow = { start: string | null; end: string }

const pad = (n: number) => String(n).padStart(2, '0')
const iso = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

/** YYYY-MM-DD → a local Date (never `new Date(iso)`, which is UTC midnight). */
export function fromIso(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/**
 * The window a preset stands for, on the user's own calendar. A month or a
 * year runs to its last day, like Analytics; "All time" runs to today.
 */
export function presetWindow(period: Exclude<ExportPeriod, 'custom'>, today: string): ExportWindow {
  const now = fromIso(today)
  const year = now.getFullYear()
  const month = now.getMonth()
  switch (period) {
    case 'month':
      return {
        start: iso(new Date(year, month, 1)),
        end: iso(new Date(year, month + 1, 0)),
      }
    case 'last-month':
      return {
        start: iso(new Date(year, month - 1, 1)),
        end: iso(new Date(year, month, 0)),
      }
    case 'year':
      return { start: `${year}-01-01`, end: `${year}-12-31` }
    case 'all':
      return { start: null, end: today }
  }
}

/** "Nov 1 – Nov 30, 2026", or "Everything up to Nov 12, 2026". */
export function describeWindow({ start, end }: ExportWindow): string {
  const to = format(fromIso(end), 'MMM d, yyyy')
  if (start === null) return `Everything up to ${to}`
  const from = fromIso(start)
  const sameYear = from.getFullYear() === fromIso(end).getFullYear()
  return `${format(from, sameYear ? 'MMM d' : 'MMM d, yyyy')} – ${to}`
}

/** Days in the window, both ends counted. */
export function daysIn({ start, end }: { start: string; end: string }): number {
  return Math.round((fromIso(end).getTime() - fromIso(start).getTime()) / 86_400_000) + 1
}
