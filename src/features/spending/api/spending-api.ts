import { apiClient, unwrap } from '@/lib/api-client'

import type { DateWindow, NoteSpendingDetail, SpendingSummary } from '../types'

/**
 * `GET /api/transactions/spending/` — the window's expenses grouped by note
 * (ignoring case and surrounding space), most spent first. At most a year;
 * longer is a 422 `spending_window_too_long`.
 */
export function getSpendingSummary(window: DateWindow): Promise<SpendingSummary> {
  return unwrap(apiClient.get<SpendingSummary>('/transactions/spending/', { params: window }))
}

/**
 * `GET /api/transactions/spending/note/` — one note's spending per day and
 * its entries. A null note asks for the expenses recorded without one.
 */
export function getNoteSpending({
  note,
  ...window
}: DateWindow & { note: string | null }): Promise<NoteSpendingDetail> {
  return unwrap(
    apiClient.get<NoteSpendingDetail>('/transactions/spending/note/', {
      params: { ...window, ...(note !== null && { note }) },
    }),
  )
}
