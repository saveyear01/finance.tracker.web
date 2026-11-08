import { transactionKeys } from '@/features/transactions'

import type { DateWindow } from '../types'

/**
 * Query-key factory for spending. It sits under `transactionKeys.all` on
 * purpose: every entry recorded, edited or deleted already invalidates that,
 * so the charts can never lag the ledger they are read from.
 */
export const spendingKeys = {
  all: [...transactionKeys.all, 'spending'] as const,
  summary: (window: DateWindow) => [...spendingKeys.all, 'summary', window] as const,
  note: (note: string | null, window: DateWindow) =>
    [...spendingKeys.all, 'note', { note, ...window }] as const,
}
