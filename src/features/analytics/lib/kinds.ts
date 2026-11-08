import type { Kind } from '../types'

/** How each tab talks about its money. */
export const KIND_WORDS: Record<
  Kind,
  { tab: string; verb: string; one: string; many: string; heading: string }
> = {
  expense: { tab: 'Expenses', verb: 'Spent', one: 'expense', many: 'expenses', heading: 'Where it went' },
  income: { tab: 'Income', verb: 'Received', one: 'income', many: 'incomes', heading: 'Where it came from' },
}

/** "1 expense", "3 incomes". */
export function countOf(kind: Kind, count: number): string {
  const words = KIND_WORDS[kind]
  return `${count} ${count === 1 ? words.one : words.many}`
}

/** The kind in the URL (`?tab=income`); expenses otherwise. */
export function kindFromParams(params: URLSearchParams): Kind {
  return params.get('tab') === 'income' ? 'income' : 'expense'
}
