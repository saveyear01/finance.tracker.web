import { useEffect, useRef, useState } from 'react'
import { Loader2, Receipt } from 'lucide-react'

import { EmptyState } from '@/components/layouts/empty-state'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { getApiErrorMessage } from '@/lib/api-client'

import { useTransactionPages } from '../hooks/use-transactions'
import { formatActivityDate, localToday } from '../lib/transaction-meta'
import type { Transaction } from '../types'
import { TransactionDrawer } from './transaction-drawer'
import { TransactionRow } from './transaction-row'

const PAGE_SIZE = 20

/** "Today", "Yesterday", or the date — the heading over a day's entries. */
function dayHeading(isoDate: string): string {
  const today = localToday()
  const [y, m, d] = today.split('-').map(Number)
  const yesterday = new Date(y, m - 1, d - 1)
  const pad = (n: number) => String(n).padStart(2, '0')
  const yesterdayIso = `${yesterday.getFullYear()}-${pad(yesterday.getMonth() + 1)}-${pad(yesterday.getDate())}`

  if (isoDate === today) return 'Today'
  if (isoDate === yesterdayIso) return 'Yesterday'
  return formatActivityDate(isoDate)
}

/** Consecutive entries grouped by day. The API already sorts newest first. */
function byDay(entries: Transaction[]): Array<{ date: string; entries: Transaction[] }> {
  const groups: Array<{ date: string; entries: Transaction[] }> = []
  for (const entry of entries) {
    const last = groups.at(-1)
    if (last?.date === entry.date) {
      last.entries.push(entry)
    } else {
      groups.push({ date: entry.date, entries: [entry] })
    }
  }
  return groups
}

/**
 * Every entry, newest first, grouped by day — loading the next 20 as the end
 * of the list scrolls into view.
 *
 * A sentinel under the list is watched with an IntersectionObserver rather
 * than listening to scroll events: no work runs while scrolling, and it works
 * inside any scroll container. The observer's margin starts the next fetch a
 * little before the end is reached, so a steady scroll rarely waits.
 *
 * A "Load more" button sits in the same place as the fallback — for keyboard
 * and screen-reader users, and for anyone whose screen is tall enough that
 * the sentinel is visible before they scroll at all.
 *
 * Tapping a row opens it, to edit or delete.
 */
export function TransactionFeed() {
  const {
    transactions,
    isLoading,
    isError,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
  } = useTransactionPages(PAGE_SIZE)
  const sentinel = useRef<HTMLDivElement>(null)
  const [selected, setSelected] = useState<Transaction | null>(null)

  useEffect(() => {
    const node = sentinel.current
    // Stop watching after a failed page: retrying on every scroll would hammer
    // the API. The button below offers the retry instead.
    if (!node || !hasNextPage || isFetchNextPageError) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isFetchingNextPage) {
          void fetchNextPage()
        }
      },
      { rootMargin: '400px 0px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage])

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
        title="No transactions yet"
        description="Record an income or an expense from Home and it shows up here."
      />
    )
  }

  return (
    <div className="space-y-5">
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
