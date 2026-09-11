import { Banknote, Landmark, Smartphone, type LucideIcon } from 'lucide-react'

import type { Wallet, WalletType } from '../types'

/**
 * Label and icon per type, shared by the cards, the table and the form so the
 * same wallet cannot be called different things depending on screen width.
 */
export const WALLET_TYPE_META: Record<WalletType, { label: string; icon: LucideIcon }> = {
  bank: { label: 'Bank', icon: Landmark },
  ewallet: { label: 'E-wallet', icon: Smartphone },
  cash: { label: 'Cash', icon: Banknote },
}

/**
 * Only an empty wallet can be archived — the API refuses anything else with
 * `wallet_has_balance`. Mirrored here so the UI never offers an action that
 * always fails. Compared as a number, so "0.00" and "-0.00" both count as
 * empty; the API remains the authority.
 */
export function canArchive(wallet: Wallet): boolean {
  return Number(wallet.balance) === 0
}
