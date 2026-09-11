/** One wallet's share of a fund — a row of the fund view (`FundHolding`). */
export type FundHolding = {
  wallet_id: string
  wallet_name: string
  /** Decimal string. Never zero: empty holdings are left out by the API. */
  balance: string
}

/** Response of `GET /api/funds/` and friends (`FundRead`). */
export type Fund = {
  id: string
  name: string
  /** The built-in fund for money with no purpose yet. Not editable. */
  is_unallocated: boolean
  /** Decimal string — the sum of `holdings`. Parse only to format. */
  balance: string
  /** Which wallets hold this fund's money, largest first. */
  holdings: FundHolding[]
  /** This fund's share of every income (1–100), or null if not allocated. */
  allocation_percentage: number | null
  /** ISO-8601 when archived, null while active. */
  archived_at: string | null
  created_at: string
}

/** Input for `POST /api/funds/`. Funds start empty. */
export type CreateFundInput = {
  name: string
}

/** Input for `PUT /api/funds/{id}/`. */
export type UpdateFundInput = {
  id: string
  name: string
}
