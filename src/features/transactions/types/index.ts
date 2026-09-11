export type TransactionType =
  | 'income'
  | 'income_auto_split'
  | 'manual_adjustment'
  | 'expense'
  | 'reallocation'
  | 'transfer'
  /** One leg of undoing another action — what "delete" records. */
  | 'reversal'

/** One ledger entry — one row of Recent Activity (`TransactionRead`). */
export type Transaction = {
  id: string
  /** Shared by every leg of one action (a split income, both sides of a move). */
  group_id: string
  type: TransactionType
  /** Signed decimal string: positive is money in, negative is money out. */
  amount: string
  /** YYYY-MM-DD — the day the money moved. */
  date: string
  note: string | null
  wallet_id: string
  wallet_name: string
  fund_id: string | null
  fund_name: string | null
  created_at: string
  /** Set on an original once it has been reversed (deleted). */
  reversed_by_group_id: string | null
  /** On a reversal's legs: the action they undo, and what kind it was. */
  reverses_group_id: string | null
  reverses_type: TransactionType | null
}

/**
 * One page of `GET /api/transactions/`. Hand `next_cursor` back as `cursor`
 * for the next page; null means there are no more. Never build one.
 */
export type TransactionPage = {
  items: Transaction[]
  next_cursor: string | null
}

/** The four things Home can record. Each is its own endpoint. */
export type LedgerAction = 'income' | 'expense' | 'reallocation' | 'transfer'

/**
 * What can be edited: the four actions, plus a manual adjustment (a wallet's
 * opening balance), which nothing records directly. Each edits at
 * `PUT /transactions/<action>/{group_id}/`. A reversal is never edited.
 */
export type EditableAction = LedgerAction | 'adjustment'

type EntryBase = {
  /** Positive decimal string — the endpoint decides the direction. */
  amount: string
  date?: string
  note?: string
}

export type IncomeInput = EntryBase & {
  wallet_id: string
} & ({ fund_id: string; auto_allocate?: false } | { auto_allocate: true; fund_id?: never })

export type ExpenseInput = EntryBase & { wallet_id: string; fund_id: string }

export type ReallocationInput = EntryBase & {
  wallet_id: string
  from_fund_id: string
  to_fund_id: string
}

export type TransferInput = EntryBase & {
  from_wallet_id: string
  to_wallet_id: string
  fund_id: string
}

/** An adjustment keeps its direction when edited; only the size changes. */
export type AdjustmentInput = EntryBase & { wallet_id: string; fund_id: string }

export type ActionInput =
  | IncomeInput
  | ExpenseInput
  | ReallocationInput
  | TransferInput
  | AdjustmentInput
