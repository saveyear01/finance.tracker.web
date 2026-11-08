import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { getNoteSpending, getSpendingSummary } from '../api/spending-api'
import { spendingKeys } from '../api/spending-keys'
import type { DateWindow } from '../types'

/**
 * The window's spending by note. Changing the range keeps the last figures
 * on screen until the new ones arrive, rather than flashing a skeleton.
 */
export function useSpendingSummary(window: DateWindow) {
  return useQuery({
    queryKey: spendingKeys.summary(window),
    queryFn: () => getSpendingSummary(window),
    placeholderData: keepPreviousData,
  })
}

/** One note's spending in the window, day by day, with its entries. */
export function useNoteSpending(note: string | null, window: DateWindow) {
  return useQuery({
    queryKey: spendingKeys.note(note, window),
    queryFn: () => getNoteSpending({ note, ...window }),
    placeholderData: keepPreviousData,
  })
}
