import { apiClient, unwrap } from '@/lib/api-client'

import type {
  ActionInput,
  EditableAction,
  ExpenseInput,
  IncomeInput,
  ReallocationInput,
  Transaction,
  TransactionPage,
  TransferInput,
} from '../types'

/**
 * `GET /api/transactions/` — one page of entries across all wallets, newest
 * first. Keyset-paginated: pass the previous page's `next_cursor` to continue,
 * so entries recorded mid-scroll never repeat a row at a page boundary.
 */
export function listTransactions({
  limit,
  cursor,
}: {
  limit: number
  cursor?: string | null
}): Promise<TransactionPage> {
  return unwrap(
    apiClient.get<TransactionPage>('/transactions/', {
      params: { limit, ...(cursor && { cursor }) },
    }),
  )
}

/*
 * One endpoint per action, each responding with the entries it created — a
 * split income comes back as several. All of an action's entries are written
 * in one commit server-side, so there is never a half-recorded action.
 * Overdrawing is a 409 `insufficient_funds` whose details carry `available`.
 */

export function recordIncome(input: IncomeInput): Promise<Transaction[]> {
  return unwrap(apiClient.post<Transaction[]>('/transactions/income/', input))
}

export function recordExpense(input: ExpenseInput): Promise<Transaction[]> {
  return unwrap(apiClient.post<Transaction[]>('/transactions/expense/', input))
}

export function reallocate(input: ReallocationInput): Promise<Transaction[]> {
  return unwrap(apiClient.post<Transaction[]>('/transactions/reallocation/', input))
}

export function transfer(input: TransferInput): Promise<Transaction[]> {
  return unwrap(apiClient.post<Transaction[]>('/transactions/transfer/', input))
}

/** `GET /api/transactions/groups/{id}/` — every leg of one action. */
export function getTransactionGroup(groupId: string): Promise<Transaction[]> {
  return unwrap(apiClient.get<Transaction[]>(`/transactions/groups/${groupId}/`))
}

/**
 * Rewrite an action in place — the same body as recording it, sent to the
 * action's own endpoint. Balances move by the difference; nothing is added
 * to the history. An auto-split income keeps its own proportions.
 */
export function editAction({
  action,
  groupId,
  input,
}: {
  action: EditableAction
  groupId: string
  input: ActionInput
}): Promise<Transaction[]> {
  return unwrap(apiClient.put<Transaction[]>(`/transactions/${action}/${groupId}/`, input))
}

/**
 * "Delete" an action: record its opposite, dated `date` (the user's today).
 * The original stays in the history, marked reversed. A 409 when it was
 * already reversed or its money has since been spent (`insufficient_funds`).
 */
export function reverseAction(input: { group_id: string; date: string }): Promise<Transaction[]> {
  return unwrap(apiClient.post<Transaction[]>('/transactions/reversal/', input))
}
