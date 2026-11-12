import { useState, type ReactNode } from 'react'
import { Landmark } from 'lucide-react'

import { AddCard } from '@/components/add-card'
import { EmptyState } from '@/components/layouts/empty-state'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { getApiErrorMessage } from '@/lib/api-client'
import { formatMoney } from '@/lib/money'

import { useDebts } from '../hooks/use-debts'
import { centsOf, summarize } from '../lib/debt-meta'
import type { Debt } from '../types'
import { DebtOrderEditor } from './debt-order-editor'
import { DebtRow } from './debt-row'

/** A section of the list: its heading with a count and total, then its rows
 * in one card — the shape Upcoming's sections have. */
function Section({
  title,
  debts,
  figure,
  action,
  ranked = false,
}: {
  title: string
  debts: Debt[]
  figure: 'remaining' | 'paid'
  action?: ReactNode
  ranked?: boolean
}) {
  const cents = debts.reduce((sum, debt) => sum + centsOf(debt[figure]), 0)
  return (
    <section className="space-y-2">
      <h2 className="flex items-baseline justify-between gap-3 px-0.5">
        <span className="text-sm font-semibold">
          {title} · {debts.length}
        </span>
        <span className="flex items-baseline gap-3 text-xs text-muted-foreground tabular-nums">
          {formatMoney(cents / 100)}
          {action}
        </span>
      </h2>
      <ul className="overflow-hidden card-surface text-card-foreground">
        {debts.map((debt, index) => (
          <DebtRow key={debt.id} debt={debt} rank={ranked ? index + 1 : null} />
        ))}
      </ul>
    </section>
  )
}

/**
 * The Debts page: what you still owe across everything, then each debt.
 *
 * Open debts come in the household's PRIORITY order — the one being paid
 * down first at the top, each with its rank — and "Edit order" swaps the
 * list for the order editor. Paid-off ones collect below in their own
 * section, as a record.
 *
 * The card at the top answers the three questions you open this page with:
 * what's left, what all of it costs a month, and how far through you are.
 * Totals are summed in integer cents, so they are exact.
 *
 * Unlike the other lists, "Add new debt" sits at the BOTTOM: debts are read
 * far more often than they are added.
 */
export function DebtList({ onAdd }: { onAdd: () => void }) {
  const { debts, isLoading, isError, error } = useDebts()
  const [ordering, setOrdering] = useState(false)
  const summary = summarize(debts)
  const openDebts = debts.filter((debt) => debt.status === 'open')
  const paidOff = debts.filter((debt) => debt.status !== 'open')

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{getApiErrorMessage(error)}</AlertDescription>
      </Alert>
    )
  }

  if (ordering) return <DebtOrderEditor debts={debts} onClose={() => setOrdering(false)} />

  const add = <AddCard label="Add new debt" onClick={onAdd} />

  return (
    <div className="space-y-4">
      <section className="rounded-xl bg-secondary p-5 text-secondary-foreground">
        <p className="text-sm opacity-85">Still to pay</p>
        <p className="mt-1 figure-xl">{formatMoney(summary.remainingCents / 100)}</p>
        <p className="mt-1 text-sm opacity-85">
          {isLoading
            ? 'Loading…'
            : summary.open === 0
              ? debts.length > 0
                ? 'Every debt paid off.'
                : 'No debts tracked.'
              : summary.monthlyCents > 0
                ? `${formatMoney(summary.monthlyCents / 100)} a month across ${summary.open} ${summary.open === 1 ? 'debt' : 'debts'}`
                : `Across ${summary.open} ${summary.open === 1 ? 'debt' : 'debts'}`}
        </p>
        {summary.owedCents > 0 && (
          <>
            <div
              className="mt-4 h-1.5 overflow-hidden rounded-full bg-secondary-foreground/15"
              role="progressbar"
              aria-valuenow={summary.progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Paid off across every debt"
            >
              <div
                className="h-full rounded-full bg-secondary-accent"
                style={{ width: `${summary.progress}%` }}
              />
            </div>
            <p className="mt-2 flex flex-wrap justify-between gap-x-3 text-sm opacity-85">
              <span>
                {formatMoney(summary.paidCents / 100)} paid off · {summary.progress}%
              </span>
              <span>of {formatMoney(summary.owedCents / 100)}</span>
            </p>
          </>
        )}
      </section>

      {isLoading ? (
        <Skeleton className="h-56 w-full rounded-xl" />
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
        <>
          {openDebts.length > 0 && (
            <Section
              title="Priority"
              debts={openDebts}
              figure="remaining"
              ranked
              action={
                openDebts.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setOrdering(true)}
                    className="rounded-md text-sm font-semibold text-primary outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    Edit order
                  </button>
                )
              }
            />
          )}
          {paidOff.length > 0 && <Section title="Paid off" debts={paidOff} figure="paid" />}
          {add}
        </>
      )}
    </div>
  )
}
