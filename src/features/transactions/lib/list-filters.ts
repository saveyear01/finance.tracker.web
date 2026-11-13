import type { ActionKind, TransactionFilter } from '../types'
import { localToday } from './transaction-meta'

/**
 * The Transactions table's filters as they sit in the URL
 * (`?q=&type=&wallet=&fund=&period=`), so a reload or a shared link opens the
 * same view. Anything unknown in the URL reads as "no filter" rather than an
 * error: a stale link should still open the page.
 */
export type Period = 'any' | 'month' | 'last-month' | 'year'

export type ListFilters = {
  q: string
  type: ActionKind | null
  wallet: string
  fund: string
  period: Period
}

export const NO_FILTERS: ListFilters = { q: '', type: null, wallet: '', fund: '', period: 'any' }

const KINDS: readonly ActionKind[] = ['income', 'expense', 'reallocation', 'transfer', 'adjustment']
const PERIODS: readonly Period[] = ['any', 'month', 'last-month', 'year']

/** The API's limit on a note search — longer is cut rather than refused. */
export const MAX_QUERY = 100

export function filtersFromParams(params: URLSearchParams): ListFilters {
  const type = params.get('type') as ActionKind | null
  const period = params.get('period') as Period | null
  return {
    q: (params.get('q') ?? '').slice(0, MAX_QUERY),
    type: type && KINDS.includes(type) ? type : null,
    wallet: params.get('wallet') ?? '',
    fund: params.get('fund') ?? '',
    period: period && PERIODS.includes(period) ? period : 'any',
  }
}

/** The params for these filters, leaving out every one that is unset — so a
 * page with no filters keeps a clean `/transactions`. */
export function paramsOf(filters: ListFilters): Record<string, string> {
  const params: Record<string, string> = {}
  if (filters.q.trim()) params.q = filters.q.trim()
  if (filters.type) params.type = filters.type
  if (filters.wallet) params.wallet = filters.wallet
  if (filters.fund) params.fund = filters.fund
  if (filters.period !== 'any') params.period = filters.period
  return params
}

export function isFiltered(filters: ListFilters): boolean {
  return Object.keys(paramsOf(filters)).length > 0
}

const pad = (n: number) => String(n).padStart(2, '0')
const isoOf = (year: number, month: number, day: number) => {
  // Through Date so month 0 / 13 roll into the neighbouring year.
  const date = new Date(year, month - 1, day)
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/**
 * The period's first and last day, in the user's own calendar — "this
 * month" is theirs, not the server's. Day 0 of the next month is the last
 * day of this one.
 */
export function periodWindow(period: Period, today = localToday()): { start?: string; end?: string } {
  const [year, month] = today.split('-').map(Number)
  switch (period) {
    case 'any':
      return {}
    case 'month':
      return { start: isoOf(year, month, 1), end: isoOf(year, month + 1, 0) }
    case 'last-month':
      return { start: isoOf(year, month - 1, 1), end: isoOf(year, month, 0) }
    case 'year':
      return { start: `${year}-01-01`, end: `${year}-12-31` }
  }
}

/** What the API is asked for. */
export function apiFilterOf(filters: ListFilters, today = localToday()): TransactionFilter {
  return {
    ...(filters.q.trim() && { q: filters.q.trim() }),
    ...(filters.type && { type: filters.type }),
    ...(filters.wallet && { walletId: filters.wallet }),
    ...(filters.fund && { fundId: filters.fund }),
    ...periodWindow(filters.period, today),
  }
}

/** The month names the period options carry, so "Last month" says which. */
export function periodOptions(today = localToday()): Array<{ value: Period; label: string }> {
  const [year, month] = today.split('-').map(Number)
  const name = (m: number) =>
    new Date(year, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  return [
    { value: 'any', label: 'Any time' },
    { value: 'month', label: `This month · ${name(month)}` },
    { value: 'last-month', label: `Last month · ${name(month - 1)}` },
    { value: 'year', label: `This year · ${year}` },
  ]
}

const NOUNS: Record<ActionKind | 'all', { noun: string; plural: boolean }> = {
  all: { noun: 'transactions', plural: true },
  income: { noun: 'income', plural: false },
  expense: { noun: 'expenses', plural: true },
  reallocation: { noun: 'moves', plural: true },
  transfer: { noun: 'transfers', plural: true },
  adjustment: { noun: 'adjustments', plural: true },
}

const PERIOD_PHRASES: Record<Period, string> = {
  any: '',
  month: 'this month',
  'last-month': 'last month',
  year: 'this year',
}

/**
 * The no-matches row's sentence, naming every active filter (design rule C):
 * `No income in GCash matches "coffee"`, `No expenses for Wants last month`.
 * Names are passed in, already looked up, so an unknown id just drops out.
 */
export function noMatchesSentence(
  filters: ListFilters,
  names: { wallet?: string; fund?: string },
): string {
  const { noun, plural } = NOUNS[filters.type ?? 'all']
  const q = filters.q.trim()
  return [
    `No ${noun}`,
    names.wallet && `in ${names.wallet}`,
    names.fund && `for ${names.fund}`,
    PERIOD_PHRASES[filters.period],
    q && `${plural ? 'match' : 'matches'} “${q}”`,
  ]
    .filter(Boolean)
    .join(' ')
}
