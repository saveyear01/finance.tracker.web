import { useMemo } from 'react'

import type { BreakdownItem } from '@/components/breakdown-list'
import { useFunds } from '@/features/funds'

/**
 * Each wallet's money by fund — `{walletId: [{fund, amount}], …}`, largest
 * first.
 *
 * Read off the funds' `holdings` (the fund view) turned inside out, rather
 * than fetched per wallet: the two dashboard views then come from one cached
 * fetch and cannot disagree (CLAUDE.md). The dependency runs the allowed way,
 * wallets → funds.
 */
export function useWalletBreakdowns(): Map<string, BreakdownItem[]> {
  const { funds } = useFunds()

  return useMemo(() => {
    const byWallet = new Map<string, BreakdownItem[]>()
    for (const fund of funds) {
      for (const holding of fund.holdings) {
        const items = byWallet.get(holding.wallet_id) ?? []
        items.push({ id: fund.id, label: fund.name, amount: holding.balance })
        byWallet.set(holding.wallet_id, items)
      }
    }
    for (const items of byWallet.values()) {
      items.sort((a, b) => Number(b.amount) - Number(a.amount))
    }
    return byWallet
  }, [funds])
}
