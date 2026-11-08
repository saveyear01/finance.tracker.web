import type { Transaction } from '@/features/transactions'

/** A stretch of days, both ends included — YYYY-MM-DD, the user's calendar. */
export type DateWindow = { start: string; end: string }

/** One note's share of a window's spending. A null note reads "Others". */
export type NoteSpending = {
  note: string | null
  /** Positive decimal string — money out, as a chart reads it. */
  spent: string
  count: number
}

/** `GET /api/transactions/spending/` — a window's expenses grouped by note. */
export type SpendingSummary = DateWindow & {
  spent: string
  count: number
  /** Most spent first; they sum to `spent` exactly. */
  notes: NoteSpending[]
}

export type DaySpending = { date: string; spent: string }

/** `GET /api/transactions/spending/note/` — one note's expenses in a window. */
export type NoteSpendingDetail = DateWindow & {
  note: string | null
  spent: string
  count: number
  /** Every day of the window, zero days included. */
  days: DaySpending[]
  /** The expenses behind the days, newest first. */
  entries: Transaction[]
}
