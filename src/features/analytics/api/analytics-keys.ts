import { transactionKeys } from '@/features/transactions'

import type { DateWindow, Kind } from '../types'

/**
 * Query-key factory for Analytics. It sits under `transactionKeys.all` on
 * purpose: every entry recorded, edited or deleted already invalidates that,
 * so the charts can never lag the ledger they are read from.
 */
export const analyticsKeys = {
  all: [...transactionKeys.all, 'analytics'] as const,
  totals: (kind: Kind, window: DateWindow) =>
    [...analyticsKeys.all, 'totals', { kind, ...window }] as const,
  days: (kind: Kind, note: string | null, window: DateWindow) =>
    [...analyticsKeys.all, 'days', { kind, note, ...window }] as const,
  summary: (kind: Kind, window: DateWindow) =>
    [...analyticsKeys.all, 'summary', { kind, ...window }] as const,
}
