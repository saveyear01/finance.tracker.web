import { transactionKeys } from '@/features/transactions'

/**
 * Query-key factory for the debts feature.
 *
 * The list lives UNDER the transactions key on purpose: what a debt has been
 * paid is read from the ledger, so anything that changes the ledger —
 * including editing or deleting the paying expense in the activity, which
 * invalidates `transactionKeys.all` — must refresh debts too. Transactions
 * can't import this feature (dependencies run one way), so the key does the
 * joining instead.
 */
export const debtKeys = {
  all: [...transactionKeys.all, 'debts'] as const,
  list: () => [...debtKeys.all, 'list'] as const,
  detail: (id: string) => [...debtKeys.all, 'detail', id] as const,
}
