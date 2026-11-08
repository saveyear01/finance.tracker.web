import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { getNoteDays, getNoteTotals } from '../api/analytics-api'
import { analyticsKeys } from '../api/analytics-keys'
import type { DateWindow, Kind } from '../types'

/**
 * The window's expenses or income by note. Changing the range keeps the last
 * figures on screen until the new ones arrive, rather than flashing a
 * skeleton.
 */
export function useNoteTotals(kind: Kind, window: DateWindow) {
  return useQuery({
    queryKey: analyticsKeys.totals(kind, window),
    queryFn: () => getNoteTotals({ kind, ...window }),
    placeholderData: keepPreviousData,
  })
}

/** One note's expenses or income in the window, day by day, with its entries. */
export function useNoteDays(kind: Kind, note: string | null, window: DateWindow) {
  return useQuery({
    queryKey: analyticsKeys.days(kind, note, window),
    queryFn: () => getNoteDays({ kind, note, ...window }),
    placeholderData: keepPreviousData,
  })
}
