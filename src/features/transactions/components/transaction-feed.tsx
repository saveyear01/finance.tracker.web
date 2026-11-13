import { useState, type ReactNode } from 'react'
import { Loader2, Receipt } from 'lucide-react'

import { EmptyState } from '@/components/layouts/empty-state'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { getApiErrorMessage } from '@/lib/api-client'
import { cn } from '@/lib/utils'

import { useLoadMore } from '../hooks/use-load-more'
import { useTransactionPages } from '../hooks/use-transactions'
import { byDay, dayHeading } from '../lib/days'
import type { Transaction, TransactionFilter } from '../types'
import { TransactionDrawer } from './transaction-drawer'
import { TransactionRow } from './transaction-row'

const PAGE_SIZE = 20

/**
 * Every entry, newest first, grouped by day — loading the next 20 as the end
 * of the list scrolls into view (`useLoadMore`), with a "Load more" button
 * in the same place as the fallback.
 *
 * Tapping a row opens it, to edit or delete.
 *
 * With `filter` it is one wallet's or one allocation's activity — the foot of
 * its own page — and `empty` says what nothing means there, optionally with
 * the button that changes it (a search with no matches offers to clear it).
 * `keepPrevious` holds the old rows while a changed filter loads, dimmed —
 * for a search, so typing doesn't flash a skeleton.
 */
export function TransactionFeed({
  filter,
  empty,
  keepPrevious = false,
}: {
  filter?: TransactionFilter
  empty?: { title: string; description: string; action?: ReactNode }
  keepPrevious?: boolean
} = {}) {
  const {
    transactions,
    isLoading,
    isError,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    isPlaceholderData,
  } = useTransactionPages(PAGE_SIZE, filter, { keepPrevious })
  const [selected, setSelected] = useState<Transaction | null>(null)
  const sentinel = useLoadMore<HTMLDivElement>({
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    fetchNextPage,
  })

  if (isLoading) {
    return <div className="h-64 animate-pulse rounded-xl bg-muted" aria-hidden="true" />
  }

  if (isError && transactions.length === 0) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {getApiErrorMessage(error, 'Could not load your transactions.')}
        </AlertDescription>
      </Alert>
    )
  }

  if (transactions.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title={empty?.title ?? 'No transactions yet'}
        description={empty?.description ?? 'Record an income or an expense from Home and it shows up here.'}
        action={empty?.action}
      />
    )
  }

  return (
    <div
      className={cn('space-y-5 transition-opacity', isPlaceholderData && 'opacity-60')}
      aria-busy={isPlaceholderData || undefined}
    >
      {byDay(transactions).map((group) => (
        <section key={group.date} aria-label={dayHeading(group.date)} className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground">
            {dayHeading(group.date)}
          </h2>
          <ul className="space-y-2">
            {group.entries.map((entry) => (
              <TransactionRow
                key={entry.id}
                entry={entry}
                showDate={false}
                onSelect={setSelected}
              />
            ))}
          </ul>
        </section>
      ))}

      <div ref={sentinel} className="flex flex-col items-center gap-2 py-2">
        {isFetchNextPageError && (
          <p className="text-sm text-destructive">Couldn't load more.</p>
        )}
        {hasNextPage ? (
          <Button
            variant="outline"
            onClick={() => void fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage && <Loader2 className="animate-spin" />}
            {isFetchingNextPage ? 'Loading…' : isFetchNextPageError ? 'Try again' : 'Load more'}
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">
            That's everything — {transactions.length}{' '}
            {transactions.length === 1 ? 'entry' : 'entries'}.
          </p>
        )}
      </div>

      <TransactionDrawer
        entry={selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null)
        }}
      />
    </div>
  )
}
