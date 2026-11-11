import type { Transaction } from '@/features/transactions'

/** A stretch of days, both ends included — YYYY-MM-DD, the user's calendar. */
export type DateWindow = { start: string; end: string }

/** Which money a tab reads: what went out, or what came in. */
export type Kind = 'expense' | 'income'

/** One note's share of a window's expenses or income. A null note reads "Others". */
export type NoteTotal = {
  note: string | null
  /** Positive decimal string whichever way the money went, as a chart reads it. */
  total: string
  /** Actions, not ledger rows — a split income is one. */
  count: number
}

/** `GET /api/transactions/by-note/` — a window's expenses or income by note. */
export type NoteTotals = DateWindow & {
  kind: Kind
  total: string
  count: number
  /** Biggest first; they sum to `total` exactly. */
  notes: NoteTotal[]
}

export type DayTotal = { date: string; total: string }

/** `GET /api/transactions/by-note/days/` — one note's expenses or income in a window. */
export type NoteDays = DateWindow & {
  kind: Kind
  note: string | null
  total: string
  count: number
  /** Every day of the window, zero days included. */
  days: DayTotal[]
  /** The entries behind the days, newest first — one per leg. */
  entries: Transaction[]
}

/** What one allocation or wallet put into a period's expenses or income. */
export type SourceTotal = { id: string; name: string; total: string; count: number }

/**
 * `GET /api/transactions/summary/` — a period's expenses or income at a
 * glance: every day's total, where it was paid from (or landed in), the
 * biggest entries, and the newest day with any before the period.
 */
export type KindSummary = DateWindow & {
  kind: Kind
  total: string
  count: number
  days: DayTotal[]
  by_fund: SourceTotal[]
  by_wallet: SourceTotal[]
  /** At most 5 legs, largest first. */
  largest: Transaction[]
  last_before: string | null
}
