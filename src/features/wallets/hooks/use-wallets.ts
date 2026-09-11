import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { listWallets } from '../api/wallets-api'
import { walletKeys } from '../api/wallets-keys'

export function useWallets({ includeArchived = false } = {}) {
  const query = useQuery({
    queryKey: walletKeys.list(includeArchived),
    queryFn: () => listWallets(includeArchived),
    // Toggling "show archived" is a different key; keep the current list on
    // screen while the other loads, rather than flashing a skeleton.
    placeholderData: keepPreviousData,
  })

  return {
    ...query,
    wallets: query.data ?? [],
  }
}
