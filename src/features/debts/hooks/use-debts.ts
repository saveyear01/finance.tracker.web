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
  reorderDebts,
  updateCharge,
  updateDebt,
  updateRate,
} from '../api/debts-api'
import { debtKeys } from '../api/debt-keys'
import type { Debt } from '../types'

/** Every debt, still-owed ones first. */
export function useDebts() {
  const query = useQuery({ queryKey: debtKeys.list(), queryFn: listDebts })
  return { ...query, debts: query.data ?? [] }
}

/** Open debts behind their schedule — the nav's amber badge. Reads the list
 * query, so it shares Debts' cache. */
export function useDebtsBehind(): number {
  const { debts } = useDebts()
  return debts.filter((debt) => debt.status === 'open' && Number(debt.schedule?.behind ?? 0) > 0)
    .length
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

/**
 * Set the priority order. Optimistic: the list takes the new order at once,
 * so a dropped row doesn't jump back while the request is out, and goes back
 * to the old one if it fails. `debtIds` names every debt (see `reorderDebts`).
 */
export function useReorderDebts() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: reorderDebts,
    onMutate: async (debtIds: string[]) => {
      await queryClient.cancelQueries({ queryKey: debtKeys.list() })
      const previous = queryClient.getQueryData<Debt[]>(debtKeys.list())
      if (previous) {
        const rank = new Map(debtIds.map((id, index) => [id, index]))
        queryClient.setQueryData<Debt[]>(
          debtKeys.list(),
          previous
            .map((debt) => ({ ...debt, position: rank.get(debt.id) ?? debt.position }))
            .sort(
              (a, b) =>
                Number(a.status === 'paid_off') - Number(b.status === 'paid_off') ||
                a.position - b.position,
            ),
        )
      }
      return { previous }
    },
    onError: (_error, _ids, context) => {
      if (context?.previous) queryClient.setQueryData(debtKeys.list(), context.previous)
    },
    onSuccess: (debts) => queryClient.setQueryData(debtKeys.list(), debts),
    // Each debt's own page shows its rank too.
    onSettled: () => queryClient.invalidateQueries({ queryKey: debtKeys.all }),
  })
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
