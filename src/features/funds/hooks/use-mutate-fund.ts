import { useMutation, useQueryClient } from '@tanstack/react-query'

import { archiveFund, createFund, restoreFund, setFundInTotal, updateFund } from '../api/funds-api'
import { fundKeys } from '../api/funds-keys'

/**
 * Fund writes only change funds — a rename or archive moves no money, so the
 * wallet list (whose balances are per wallet) is untouched.
 */
function useFundInvalidation() {
  const queryClient = useQueryClient()

  return () => queryClient.invalidateQueries({ queryKey: fundKeys.all })
}

export function useCreateFund() {
  const invalidate = useFundInvalidation()

  return useMutation({ mutationFn: createFund, onSuccess: invalidate })
}

export function useUpdateFund() {
  const invalidate = useFundInvalidation()

  return useMutation({ mutationFn: updateFund, onSuccess: invalidate })
}

export function useArchiveFund() {
  const invalidate = useFundInvalidation()

  return useMutation({ mutationFn: archiveFund, onSuccess: invalidate })
}

export function useRestoreFund() {
  const invalidate = useFundInvalidation()

  return useMutation({ mutationFn: restoreFund, onSuccess: invalidate })
}

/** Home reads the funds list for its total, so invalidating funds is enough. */
export function useSetFundInTotal() {
  const invalidate = useFundInvalidation()

  return useMutation({ mutationFn: setFundInTotal, onSuccess: invalidate })
}
