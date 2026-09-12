import { Landmark } from 'lucide-react'

import { AddCard } from '@/components/add-card'
import { EmptyState } from '@/components/layouts/empty-state'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { getApiErrorMessage } from '@/lib/api-client'
import { formatMoney } from '@/lib/money'

import { useDebts } from '../hooks/use-debts'
import { summarize } from '../lib/debt-meta'
import { DebtRow } from './debt-row'

/**
 * The Debts page: what you still owe across everything, then each debt —
 * open ones first, paid-off ones kept below as a record. A row opens the
 * debt's own page, which is where anything can be done to it.
 *
 * Unlike the other lists, "New debt" sits at the BOTTOM: debts are read far
 * more often than they are added, and what is owed should be the first thing
 * under the total rather than an empty slot.
 *
 * The total is summed in integer cents, so it is exact.
 */
export function DebtList({ onAdd }: { onAdd: () => void }) {
  const { debts, isLoading, isError, error } = useDebts()
  const { remainingCents, open } = summarize(debts)

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{getApiErrorMessage(error)}</AlertDescription>
      </Alert>
    )
  }

  const add = <AddCard label="Add new debt" onClick={onAdd} />

  return (
    <div className="space-y-4">
      <section className="rounded-2xl bg-secondary p-5 text-secondary-foreground">
        <p className="text-sm opacity-80">Still to pay</p>
        <p className="mt-1 text-3xl font-semibold tabular-nums">
          {formatMoney(remainingCents / 100)}
        </p>
        <p className="mt-1 text-sm opacity-80">
          {isLoading
            ? 'Loading…'
            : open === 0
              ? debts.length > 0
                ? 'Every debt paid off.'
                : 'No debts tracked.'
              : `Across ${open} ${open === 1 ? 'debt' : 'debts'}.`}
        </p>
      </section>

      {isLoading ? (
        <ul className="space-y-2">
          {[0, 1, 2].map((key) => (
            <li key={key}>
              <Skeleton className="h-20 w-full rounded-xl" />
            </li>
          ))}
        </ul>
      ) : debts.length === 0 ? (
        <div className="space-y-3">
          <EmptyState
            icon={Landmark}
            title="Nothing owed"
            description="Track a loan or a card balance to watch it come down."
          />
          {add}
        </div>
      ) : (
        <div className="space-y-2">
          <ul className="space-y-2">
            {debts.map((debt) => (
              <DebtRow key={debt.id} debt={debt} />
            ))}
          </ul>
          {add}
        </div>
      )}
    </div>
  )
}
