import { useState } from 'react'
import { Receipt } from 'lucide-react'

import { EmptyState } from '@/components/layouts/empty-state'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { getApiErrorMessage } from '@/lib/api-client'

import { useRecentTransactions } from '../hooks/use-transactions'
import type { Transaction } from '../types'
import { TransactionDrawer } from './transaction-drawer'
import { TransactionRow } from './transaction-row'

/**
 * The latest ledger entries, one row each — Home's "Recent Activity". A split
 * income shows as one row per fund it reached; a move or transfer as its two
 * legs, "out" above "in". Everything else is on the Transactions page.
 * Tapping a row opens it, to edit or delete.
 */
export function RecentActivity({ limit = 10 }: { limit?: number }) {
  const { transactions, isLoading, isError, error } = useRecentTransactions(limit)
  const [selected, setSelected] = useState<Transaction | null>(null)

  if (isLoading) {
    return <div className="h-48 animate-pulse rounded-xl bg-muted" aria-hidden="true" />
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {getApiErrorMessage(error, 'Could not load your recent activity.')}
        </AlertDescription>
      </Alert>
    )
  }

  if (transactions.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title="Nothing recorded yet"
        description="Record an income or an expense and it shows up here."
      />
    )
  }

  return (
    <>
      <ul className="space-y-2">
        {transactions.map((entry) => (
          <TransactionRow key={entry.id} entry={entry} onSelect={setSelected} />
        ))}
      </ul>
      <TransactionDrawer
        entry={selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null)
        }}
      />
    </>
  )
}
