import { useMutation, useQueryClient } from '@tanstack/react-query'

import { fundKeys } from '@/features/funds'

import {
  archiveWallet,
  createWallet,
  restoreWallet,
  updateWallet,
} from '../api/wallets-api'
import { walletKeys } from '../api/wallets-keys'

/**
 * Every wallet write can change more than one cached list — archiving moves a
 * wallet between the active and the with-archived lists — so all of them are
 * invalidated rather than patched.
 *
 * The funds lists go stale too: an opening balance lands in Unallocated, and
 * fund holdings are labelled with wallet names. The dependency runs one way —
 * wallets know about funds' keys, funds import nothing from wallets — so the
 * two barrels cannot form an import cycle.
 */
function useWalletInvalidation() {
  const queryClient = useQueryClient()

  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: walletKeys.all }),
      queryClient.invalidateQueries({ queryKey: fundKeys.all }),
    ])
}

export function useCreateWallet() {
  const invalidate = useWalletInvalidation()

  return useMutation({ mutationFn: createWallet, onSuccess: invalidate })
}

export function useUpdateWallet() {
  const invalidate = useWalletInvalidation()

  return useMutation({ mutationFn: updateWallet, onSuccess: invalidate })
}

export function useArchiveWallet() {
  const invalidate = useWalletInvalidation()

  return useMutation({ mutationFn: archiveWallet, onSuccess: invalidate })
}

export function useRestoreWallet() {
  const invalidate = useWalletInvalidation()

  return useMutation({ mutationFn: restoreWallet, onSuccess: invalidate })
}
