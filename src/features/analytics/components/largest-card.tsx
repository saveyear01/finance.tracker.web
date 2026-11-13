import { TransactionRow, type Transaction } from '@/features/transactions'

import type { Kind } from '../types'

/**
 * The period's biggest entries — the few that make up most of a month. Each
 * opens the same drawer as on Transactions, to see, edit or delete it.
 */
export function LargestCard({
  kind,
  entries,
  onSelect,
}: {
  kind: Kind
  entries: Transaction[]
  onSelect: (entry: Transaction) => void
}) {
  if (entries.length === 0) return null
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold">{kind === 'income' ? 'Biggest incomes' : 'Biggest expenses'}</h2>
      {/* Full width from lg: two columns, so a row isn't 1,200px from its note to its amount. */}
      <ul className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-2 lg:space-y-0">
        {entries.map((entry) => (
          <TransactionRow key={entry.id} entry={entry} onSelect={onSelect} />
        ))}
      </ul>
    </section>
  )
}
