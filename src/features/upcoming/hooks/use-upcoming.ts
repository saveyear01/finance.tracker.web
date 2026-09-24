import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { fundKeys } from '@/features/funds'
import { transactionKeys } from '@/features/transactions'
import { walletKeys } from '@/features/wallets'

import {
  createUpcoming,
  deleteUpcoming,
  getOccurrence,
  listDue,
  listPinned,
  payUpcoming,
  pinUpcoming,
  skipUpcoming,
  undoSkip,
  unpinUpcoming,
  updateUpcoming,
} from '../api/upcoming-api'
import { upcomingKeys } from '../api/upcoming-keys'

/**
 * One month's bills — or a range of them, with `through`.
 *
 * `carryOverdue` for the current month's tab; `excludeMonthly` for the later
 * tab, where every-month bills would crowd out what is actually worth
 * looking ahead for.
 */
export function useDue(
  month: string,
  {
    through,
    carryOverdue = false,
    excludeMonthly = false,
  }: { through?: string; carryOverdue?: boolean; excludeMonthly?: boolean } = {},
) {
  // Normalised, so the same query never lands under two different keys.
  const options = { through, carryOverdue, excludeMonthly }
  const query = useQuery({
    queryKey: upcomingKeys.dueMonth(month, options),
    queryFn: () => listDue({ month, ...options }),
  })
  return { ...query, occurrences: query.data ?? [] }
}

/**
 * One due date in full, for its own page. Fetched rather than picked out of
 * a month's list, so opening it by link or reloading works on its own.
 */
export function useOccurrence(id: string | undefined, dueDate: string | undefined) {
  const query = useQuery({
    queryKey: upcomingKeys.occurrence(id ?? '', dueDate ?? ''),
    queryFn: () => getOccurrence({ id: id as string, dueDate: dueDate as string }),
    enabled: Boolean(id && dueDate),
  })
  return { ...query, occurrence: query.data }
}

/** The pinned bills' due dates in `month` (plus earlier ones still owed) —
 * Home's list. */
export function usePinned(month: string) {
  const query = useQuery({
    queryKey: upcomingKeys.pinned(month),
    queryFn: () => listPinned({ month }),
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

/** Pinning changes the bill (its `pinned_at`) and Home's list — the due
 * lists carry the bill, so they refresh with it. */
export function usePinUpcoming() {
  const invalidate = useInvalidateBills()
  return useMutation({ mutationFn: pinUpcoming, onSuccess: invalidate })
}

export function useUnpinUpcoming() {
  const invalidate = useInvalidateBills()
  return useMutation({ mutationFn: unpinUpcoming, onSuccess: invalidate })
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
