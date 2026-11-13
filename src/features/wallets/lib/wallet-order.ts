import type { Wallet } from '../types'

/**
 * The Wallets tab's rows in the order it shows them: the active wallets in
 * API order, then the archived ones behind "Show N archived". One place, so
 * the list and the big screen's "open the first row" never disagree.
 */
export function walletGroups(wallets: Wallet[]) {
  return {
    active: wallets.filter((wallet) => wallet.archived_at === null),
    archived: wallets.filter((wallet) => wallet.archived_at !== null),
  }
}
