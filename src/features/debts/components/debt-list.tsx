import { useState } from 'react'
import { Landmark } from 'lucide-react'

import { AddCard } from '@/components/add-card'
import { EmptyState } from '@/components/layouts/empty-state'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { getApiErrorMessage } from '@/lib/api-client'
import { formatMoney } from '@/lib/money'

import { useDebts } from '../hooks/use-debts'
import { summarize } from '../lib/debt-meta'
import { DebtOrderEditor } from './debt-order-editor'
import { DebtRow } from './debt-row'

/**
 * The Debts page, minimal since 2026-11-13 (mockup `design/debts-minimal.html`
 * — the user found it overwhelming): no dark "Still to pay" card. Open debts
 * come in the household's PRIORITY order — the one being paid down first at
 * the top, each with its rank — and "Edit order" swaps the list for the
 * order editor. The sum is the list's quiet last row, with what the open
 * debts cost a month beside it (as Wallets closes its list), not a headline.
 *
 * Paid-off ones are a record, behind "Show N paid off" — shown when the one
 * open beside the list is paid off, so the marked row is never hidden.
 * Totals are summed in integer cents, so they are exact.
 *
 * Unlike the other lists, "Add new debt" sits at the BOTTOM: debts are read
 * far more often than they are added.
 *
 * `selectedId` is the debt open beside the list on a big screen, if any.
 */
export function DebtList({ onAdd, selectedId }: { onAdd: () => void; selectedId?: string }) {
  const { debts, isLoading, isError, error } = useDebts()
  const [ordering, setOrdering] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const summary = summarize(debts)
  const openDebts = debts.filter((debt) => debt.status === 'open')
  const paidOff = debts.filter((debt) => debt.status !== 'open')
  const showPaidOff = expanded || paidOff.some((debt) => debt.id === selectedId)

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{getApiErrorMessage(error)}</AlertDescription>
      </Alert>
    )
  }

  if (ordering) return <DebtOrderEditor debts={debts} onClose={() => setOrdering(false)} />

  const add = <AddCard label="Add new debt" onClick={onAdd} />

  if (isLoading) return <Skeleton className="h-56 w-full rounded-xl" />

  if (debts.length === 0) {
    return (
      <div className="space-y-3">
        <EmptyState
          icon={Landmark}
          title="Nothing owed"
          description="Track a loan or a card balance to watch it come down."
        />
        {add}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {openDebts.length > 0 && (
        <section className="space-y-2">
          <h2 className="flex items-baseline justify-between gap-3 px-0.5">
            <span className="text-sm font-semibold">Priority · {openDebts.length}</span>
            {openDebts.length > 1 && (
              <button
                type="button"
                onClick={() => setOrdering(true)}
                className="rounded-md text-sm font-semibold text-primary outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                Edit order
              </button>
            )}
          </h2>
          <ul className="overflow-hidden card-surface text-card-foreground">
            {openDebts.map((debt, index) => (
              <DebtRow key={debt.id} debt={debt} rank={index + 1} selected={debt.id === selectedId} />
            ))}
            <li className="flex items-center justify-between gap-3 border-t border-border bg-muted/40 px-4 py-2.5 text-sm text-muted-foreground">
              <span>
                Total
                {summary.monthlyCents > 0 && ` · ${formatMoney(summary.monthlyCents / 100)} a month`}
              </span>
              <span className="font-medium tabular-nums">{formatMoney(summary.remainingCents / 100)}</span>
            </li>
          </ul>
        </section>
      )}

      {openDebts.length === 0 && <p className="px-0.5 text-sm text-muted-foreground">Every debt paid off.</p>}

      {add}

      {paidOff.length > 0 &&
        (showPaidOff ? (
          <section className="space-y-2 pt-2">
            <h2 className="px-0.5 text-sm font-semibold text-muted-foreground">Paid off · {paidOff.length}</h2>
            <ul className="overflow-hidden card-surface text-card-foreground">
              {paidOff.map((debt) => (
                <DebtRow key={debt.id} debt={debt} rank={null} selected={debt.id === selectedId} />
              ))}
            </ul>
          </section>
        ) : (
          <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => setExpanded(true)}>
            Show {paidOff.length} paid off
          </Button>
        ))}
    </div>
  )
}
