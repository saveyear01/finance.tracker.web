/** How an upcoming expense repeats — the API's `Recurrence`. */
export type Recurrence = 'none' | 'monthly' | 'yearly'

/** A bill as the API returns it (`UpcomingExpenseRead`). */
export type UpcomingExpense = {
  id: string
  name: string
  /** Expected amount, decimal string. Paying may differ. */
  amount: string
  /** YYYY-MM-DD — the FIRST due date; later ones follow from `recurrence`. */
  due_date: string
  recurrence: Recurrence
  note: string | null
  /** When it was pinned to Home for quick access; null when it isn't. */
  pinned_at: string | null
  created_at: string
}

/** One payment towards a due date — read live from the ledger. */
export type UpcomingPayment = {
  group_id: string
  /** Positive decimal string: what was paid. */
  amount: string
  paid_on: string
}

/**
 * Where a due date stands. Partial: some paid, the rest still due. Paid:
 * payments reached the bill's amount. Skipped: not owed any more (the rest
 * of it, if partly paid). Overdue isn't a status — it depends on the user's
 * today, so the client works it out.
 */
export type OccurrenceStatus = 'unpaid' | 'partial' | 'paid' | 'skipped'

/** One due date of one bill — a row of the month tabs (`OccurrenceRead`). */
export type Occurrence = {
  expense: UpcomingExpense
  due_date: string
  status: OccurrenceStatus
  /** What the payments add up to, decimal string. */
  paid: string
  /** Still owed at the bill's amount. Negative once payments went past it
   * — a paid bill still takes payments; this is the overrun. "0.00" once
   * skipped. */
  remaining: string
  /** Oldest first. */
  payments: UpcomingPayment[]
}

/** Body of `POST /upcoming-expenses/` and `PUT /upcoming-expenses/{id}/`. */
export type UpcomingExpenseInput = {
  name: string
  amount: string
  due_date: string
  recurrence: Recurrence
  note?: string
}

/** Body of `POST /upcoming-expenses/{id}/payments/`. */
export type PaymentInput = {
  due_date: string
  wallet_id: string
  fund_id: string
  amount: string
  date: string
  note?: string
}
