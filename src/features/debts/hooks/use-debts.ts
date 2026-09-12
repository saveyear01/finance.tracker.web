import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { fundKeys } from '@/features/funds'
import { transactionKeys } from '@/features/transactions'
import { walletKeys } from '@/features/wallets'

import {
  addCharge,
  addRate,
  createDebt,
  deleteCharge,
  deleteDebt,
  deleteRate,
  getDebt,
  listDebts,
  payDebt,
  updateCharge,
  updateDebt,
  updateRate,
} from '../api/debts-api'
import { debtKeys } from '../api/debt-keys'

/** Every debt, still-owed ones first. */
export function useDebts() {
  const query = useQuery({ queryKey: debtKeys.list(), queryFn: listDebts })
  return { ...query, debts: query.data ?? [] }
}

/** One debt in full, for its own page. Fetched rather than picked out of the
 * list, so opening the page by link or reloading it works on its own. */
export function useDebt(id: string | undefined) {
  const query = useQuery({
    queryKey: debtKeys.detail(id ?? ''),
    queryFn: () => getDebt(id as string),
    enabled: Boolean(id),
  })
  return { ...query, debt: query.data }
}

/**
 * Changing a debt, a charge or a rate changes only the debts data: none of
 * them moves money, so no balance anywhere else can have shifted. Both the
 * list and any open detail page sit under `debtKeys.all`, so one call covers
 * them.
 */
function useInvalidateDebts() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: debtKeys.all })
}

export function useCreateDebt() {
  return useMutation({ mutationFn: createDebt, onSuccess: useInvalidateDebts() })
}

export function useUpdateDebt() {
  return useMutation({ mutationFn: updateDebt, onSuccess: useInvalidateDebts() })
}

export function useDeleteDebt() {
  return useMutation({ mutationFn: deleteDebt, onSuccess: useInvalidateDebts() })
}

export function useAddCharge() {
  return useMutation({ mutationFn: addCharge, onSuccess: useInvalidateDebts() })
}

export function useUpdateCharge() {
  return useMutation({ mutationFn: updateCharge, onSuccess: useInvalidateDebts() })
}

export function useDeleteCharge() {
  return useMutation({ mutationFn: deleteCharge, onSuccess: useInvalidateDebts() })
}

export function useAddRate() {
  return useMutation({ mutationFn: addRate, onSuccess: useInvalidateDebts() })
}

export function useUpdateRate() {
  return useMutation({ mutationFn: updateRate, onSuccess: useInvalidateDebts() })
}

export function useDeleteRate() {
  return useMutation({ mutationFn: deleteRate, onSuccess: useInvalidateDebts() })
}

/**
 * Paying records an expense, so every balance may have changed: the ledger
 * (which also refreshes the debts list — see `debtKeys`), wallets, funds.
 */
export function usePayDebt() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: payDebt,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: transactionKeys.all }),
        queryClient.invalidateQueries({ queryKey: walletKeys.all }),
        queryClient.invalidateQueries({ queryKey: fundKeys.all }),
      ]),
  })
}
