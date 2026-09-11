import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { fundKeys } from '@/features/funds'
import { transactionKeys } from '@/features/transactions'
import { walletKeys } from '@/features/wallets'

import {
  createUpcoming,
  deleteUpcoming,
  listDue,
  payUpcoming,
  skipUpcoming,
  undoSkip,
  updateUpcoming,
} from '../api/upcoming-api'
import { upcomingKeys } from '../api/upcoming-keys'

/** One month's bills. `carryOverdue` for the current month's tab. */
export function useDue(month: string, { carryOverdue = false } = {}) {
  const query = useQuery({
    queryKey: upcomingKeys.dueMonth(month, carryOverdue),
    queryFn: () => listDue({ month, carryOverdue }),
  })
  return { ...query, occurrences: query.data ?? [] }
}

/** Changing a bill changes the due lists, nothing else. */
function useInvalidateBills() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: upcomingKeys.all }),
      queryClient.invalidateQueries({ queryKey: upcomingKeys.due() }),
    ])
}

export function useCreateUpcoming() {
  const invalidate = useInvalidateBills()
  return useMutation({ mutationFn: createUpcoming, onSuccess: invalidate })
}

export function useUpdateUpcoming() {
  const invalidate = useInvalidateBills()
  return useMutation({ mutationFn: updateUpcoming, onSuccess: invalidate })
}

export function useDeleteUpcoming() {
  const invalidate = useInvalidateBills()
  return useMutation({ mutationFn: deleteUpcoming, onSuccess: invalidate })
}

/** Skipping moves no money: only the due lists change. */
export function useSkipUpcoming() {
  const invalidate = useInvalidateBills()
  return useMutation({ mutationFn: skipUpcoming, onSuccess: invalidate })
}

export function useUndoSkip() {
  const invalidate = useInvalidateBills()
  return useMutation({ mutationFn: undoSkip, onSuccess: invalidate })
}

/**
 * Paying records an expense, so every balance may have changed: the ledger
 * (which also refreshes the due lists — see `upcomingKeys`), wallets, funds.
 */
export function usePayUpcoming() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: payUpcoming,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: transactionKeys.all }),
        queryClient.invalidateQueries({ queryKey: walletKeys.all }),
        queryClient.invalidateQueries({ queryKey: fundKeys.all }),
      ]),
  })
}
