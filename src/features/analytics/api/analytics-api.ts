import { apiClient, unwrap } from '@/lib/api-client'

import type { DateWindow, Kind, NoteDays, NoteTotals } from '../types'

/**
 * `GET /api/transactions/by-note/` — the window's expenses or income grouped
 * by note (ignoring case and surrounding space), biggest first. At most a
 * year; longer is a 422 `analytics_window_too_long`.
 */
export function getNoteTotals({ kind, ...window }: DateWindow & { kind: Kind }): Promise<NoteTotals> {
  return unwrap(apiClient.get<NoteTotals>('/transactions/by-note/', { params: { kind, ...window } }))
}

/**
 * `GET /api/transactions/by-note/days/` — one note's total per day and its
 * entries. A null note asks for the entries recorded without one.
 */
export function getNoteDays({
  kind,
  note,
  ...window
}: DateWindow & { kind: Kind; note: string | null }): Promise<NoteDays> {
  return unwrap(
    apiClient.get<NoteDays>('/transactions/by-note/days/', {
      params: { kind, ...window, ...(note !== null && { note }) },
    }),
  )
}
