/** The wallet types the API accepts — the same list as `WalletType` there. */
export const WALLET_TYPES = ['bank', 'ewallet', 'cash'] as const

export type WalletType = (typeof WALLET_TYPES)[number]

/** Response of `GET /api/wallets/` and friends (`WalletRead`). */
export type Wallet = {
  id: string
  name: string
  type: WalletType
  /**
   * Decimal string, e.g. "1500.00" — the sum of the wallet's fund
   * balances. Parse only to format; never do arithmetic on it as a float.
   */
  balance: string
  /** ISO-8601 when archived, null while active. */
  archived_at: string | null
  created_at: string
}

/** Input for `POST /api/wallets/`. */
export type CreateWalletInput = {
  name: string
  type: WalletType
  /** Decimal string; "0" posts nothing to the ledger. */
  opening_balance: string
}

/** Input for `PUT /api/wallets/{id}/`. The balance is not editable. */
export type UpdateWalletInput = {
  id: string
  name: string
  type: WalletType
}
