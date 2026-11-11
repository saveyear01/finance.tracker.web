import type { EditableAction, TransactionFilter } from '../types'

/** Query-key factory for everything the transactions feature caches. */
export const transactionKeys = {
  all: ['transactions'] as const,
  pages: (pageSize: number, filter: TransactionFilter = {}) =>
    [...transactionKeys.all, 'pages', { pageSize, ...filter }] as const,
  group: (groupId: string) => [...transactionKeys.all, 'group', groupId] as const,
  /** Past notes offered by the note field, per kind of action. */
  notes: (action: EditableAction) => [...transactionKeys.all, 'notes', action] as const,
}
