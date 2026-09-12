import { transactionKeys } from '@/features/transactions'

/**
 * Query-key factory for the upcoming-expenses feature.
 *
 * The due lists live UNDER the transactions key on purpose: whether a bill
 * is paid is read from the ledger, so anything that changes the ledger —
 * including editing or deleting the paying expense in the activity, which
 * invalidates `transactionKeys.all` — must refresh them too. Transactions
 * can't import this feature (dependencies run one way), so the key does the
 * joining instead.
 */
export const upcomingKeys = {
  all: ['upcoming-expenses'] as const,
  due: () => [...transactionKeys.all, 'upcoming-due'] as const,
  dueMonth: (
    month: string,
    options: { through?: string; carryOverdue?: boolean; excludeMonthly?: boolean },
  ) => [...upcomingKeys.due(), { month, ...options }] as const,
}
