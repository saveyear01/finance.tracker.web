import { useNavigate } from 'react-router-dom'

import { allocationGroups, useFunds } from '@/features/funds'
import { useWallets, walletGroups } from '@/features/wallets'

export type FundsTab = 'wallets' | 'allocations'

/** Where a row on each tab says "back" goes — the tab it was opened from. */
export const tabPath = (tab: FundsTab) => `/funds?tab=${tab}`

/**
 * The page each tab opens on a big screen, where Funds is a list beside the
 * open item (design/large-screen.html, "Funds"): its first row as the tab
 * lists it — an active one when there is any, else an archived one (which
 * the list then shows) — or null when the tab is empty.
 *
 * The same `includeArchived` queries the tabs make, so this costs no fetch.
 */
export function useFirstRows() {
  const walletsQuery = useWallets({ includeArchived: true })
  const fundsQuery = useFunds({ includeArchived: true })

  const wallets = walletGroups(walletsQuery.wallets)
  const funds = allocationGroups(fundsQuery.funds)
  const wallet = wallets.active[0] ?? wallets.archived[0]
  const fund = funds.counted[0] ?? funds.aside[0] ?? funds.archived[0]

  return {
    isLoading: walletsQuery.isLoading || fundsQuery.isLoading,
    isError: walletsQuery.isError || fundsQuery.isError,
    first: {
      wallets: wallet ? `/funds/wallets/${wallet.id}` : null,
      allocations: fund ? `/funds/allocations/${fund.id}` : null,
    } satisfies Record<FundsTab, string | null>,
  }
}

/**
 * Switching tabs on a big screen opens that tab's first row beside the list
 * (or the tab's empty page). It replaces the history entry, as switching
 * tabs does on a phone — flipping tabs isn't navigating.
 */
export function useSwitchTab() {
  const navigate = useNavigate()
  const { first } = useFirstRows()
  return (tab: FundsTab) => {
    const path = first[tab]
    if (path) navigate(path, { replace: true, state: { from: tabPath(tab) } })
    else navigate(tabPath(tab), { replace: true })
  }
}
