/** How a debt's interest rate behaves — the API's `RateKind`. */
export type RateKind = 'fixed' | 'variable'

/** Where a debt stands. Paid off: payments reached what it owes. */
export type DebtStatus = 'open' | 'paid_off'

/** One rate the debt carried from a date onwards (`DebtRateRead`). */
export type DebtRate = {
  id: string
  /** MONTHLY percentage as a decimal string: "1.250" is 1.25% a month. */
  monthly_rate: string
  effective_from: string
}

/** Something added to what the debt owes — a fee, billed interest, a
 * restructure (`DebtChargeRead`). No money moved. */
export type DebtCharge = {
  id: string
  /** Positive decimal string. */
  amount: string
  charged_on: string
  note: string | null
}

/** One payment towards a debt — read live from the ledger. */
export type DebtPayment = {
  group_id: string
  /** Positive decimal string: what was paid. */
  amount: string
  paid_on: string
}

/** A debt and where it stands (`DebtRead`). */
export type Debt = {
  id: string
  name: string
  lender: string | null
  /** What was borrowed. Never changes as you pay, or as fees are added. */
  principal: string
  /** What the lender asks for each period, when there is such a figure.
   * A debt with a term computes its monthly payment instead. */
  minimum_payment: string | null
  opened_on: string
  /** How many months it runs for; null for open-ended debt. */
  tenure_months: number | null
  rate_kind: RateKind
  note: string | null
  created_at: string

  status: DebtStatus
  /** Principal + interest + charges: what the debt comes to in total. */
  owed: string
  /** Flat interest over the whole term; "0.00" without a rate AND a term. */
  interest: string
  /** What the charges add up to. */
  charged: string
  /** What the standing payments add up to. */
  paid: string
  /** Left of `owed`; never below "0.00". */
  remaining: string
  /** One month of the term — (principal + interest) / months. Null without
   * a term. Charges sit on top of the schedule, so they are not in it. */
  monthly_payment: string | null
  /** The MONTHLY rate in force today, or null on an interest-free debt. */
  current_rate: string | null
  /** Oldest first — the rate history. */
  rates: DebtRate[]
  /** Newest first. */
  charges: DebtCharge[]
  /** Oldest first. */
  payments: DebtPayment[]
}

/** Body of `POST /debts/`. */
export type DebtCreateInput = {
  name: string
  lender?: string
  principal: string
  minimum_payment?: string
  opened_on: string
  /** Left out for open-ended debt. */
  tenure_months?: number
  rate_kind: RateKind
  /** Percent per MONTH. Left out for interest-free debt. */
  monthly_rate?: string
  note?: string
}

/** Body of `PUT /debts/{id}/`. The rate is not here on purpose: it is
 * edited through `/rates/`, so editing a name can't rewrite the history. */
export type DebtUpdateInput = Omit<DebtCreateInput, 'monthly_rate'>

/** Body of `POST|PUT /debts/{id}/rates/`. */
export type DebtRateInput = {
  monthly_rate: string
  effective_from: string
}

/** Body of `POST|PUT /debts/{id}/charges/`. */
export type DebtChargeInput = {
  amount: string
  charged_on: string
  note?: string
}

/** Body of `POST /debts/{id}/payments/`. */
export type DebtPaymentInput = {
  wallet_id: string
  fund_id: string
  amount: string
  date: string
  note?: string
}
