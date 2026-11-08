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
