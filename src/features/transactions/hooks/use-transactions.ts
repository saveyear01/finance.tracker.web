import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import { fundKeys } from '@/features/funds'
import { walletKeys } from '@/features/wallets'

import {
  editAction,
  getTransactionGroup,
  listNoteSuggestions,
  listTransactions,
  reallocate,
  recordExpense,
  recordIncome,
  deleteAction,
  transfer,
} from '../api/transactions-api'
import { transactionKeys } from '../api/transactions-keys'
import type { EditableAction } from '../types'

/** The latest few entries — Home's Recent Activity. */
export function useRecentTransactions(limit = 10) {
  const query = useQuery({
    queryKey: transactionKeys.recent(limit),
    queryFn: () => listTransactions({ limit }),
  })

  return { ...query, transactions: query.data?.items ?? [] }
}

/**
 * Every entry, a page at a time — the Transactions page's infinite scroll.
 * Each page's `next_cursor` is the next page's param; a null cursor ends it.
 */
export function useTransactionPages(pageSize = 20) {
  const query = useInfiniteQuery({
    queryKey: transactionKeys.pages(pageSize),
    queryFn: ({ pageParam }) => listTransactions({ limit: pageSize, cursor: pageParam }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.next_cursor,
  })

  return {
    ...query,
    transactions: query.data?.pages.flatMap((page) => page.items) ?? [],
  }
}

/**
 * Every leg of one action — what the details drawer shows and an edit is
 * filled from. The row that was tapped may be only one of several legs, and
 * the others can sit on another page (or past Home's ten).
 */
export function useTransactionGroup(groupId: string | null) {
  const query = useQuery({
    queryKey: transactionKeys.group(groupId ?? ''),
    queryFn: () => getTransactionGroup(groupId!),
    enabled: groupId !== null,
  })

  return { ...query, legs: query.data ?? [] }
}

/**
 * The notes already used on this kind of action — what the note field
 * suggests, and what a typed note is snapped onto when it differs only in
 * case or spacing.
 *
 * Fetched once per action and filtered in the browser while typing. It sits
 * under `transactionKeys.all`, so recording or editing an entry refreshes it
 * along with everything else: a note used just now should be offered next
 * time without a reload.
 */
export function useNoteSuggestions(action: EditableAction | null) {
  const query = useQuery({
    queryKey: transactionKeys.notes(action ?? 'expense'),
    queryFn: () => listNoteSuggestions({ action: action! }),
    enabled: action !== null,
  })

  return { ...query, suggestions: query.data ?? [] }
}

/**
 * Every action moves money, so every balance anywhere may have changed: the
 * wallet totals, the fund totals and holdings, and the activity feed. All
 * three are invalidated — patching them by hand would be a second copy of the
 * ledger's arithmetic in the browser.
 *
 * Dependencies run one way: transactions use the wallets' and funds' keys;
 * neither imports anything from transactions.
 */
function useLedgerInvalidation() {
  const queryClient = useQueryClient()

  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: transactionKeys.all }),
      queryClient.invalidateQueries({ queryKey: walletKeys.all }),
      queryClient.invalidateQueries({ queryKey: fundKeys.all }),
    ])
}

export function useRecordIncome() {
  const invalidate = useLedgerInvalidation()
  return useMutation({ mutationFn: recordIncome, onSuccess: invalidate })
}

export function useRecordExpense() {
  const invalidate = useLedgerInvalidation()
  return useMutation({ mutationFn: recordExpense, onSuccess: invalidate })
}

export function useReallocate() {
  const invalidate = useLedgerInvalidation()
  return useMutation({ mutationFn: reallocate, onSuccess: invalidate })
}

export function useTransfer() {
  const invalidate = useLedgerInvalidation()
  return useMutation({ mutationFn: transfer, onSuccess: invalidate })
}

export function useEditAction() {
  const invalidate = useLedgerInvalidation()
  return useMutation({ mutationFn: editAction, onSuccess: invalidate })
}

export function useDeleteAction() {
  const invalidate = useLedgerInvalidation()
  return useMutation({ mutationFn: deleteAction, onSuccess: invalidate })
}
