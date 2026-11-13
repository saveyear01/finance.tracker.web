import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, Receipt } from 'lucide-react'

import { EmptyState } from '@/components/layouts/empty-state'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useCurrentUser } from '@/features/auth'
import { OTHER_FUND_COLOR, fundColors, useFunds } from '@/features/funds'
import { useWallets, WalletAvatar } from '@/features/wallets'
import { getApiErrorMessage } from '@/lib/api-client'
import { formatMoney } from '@/lib/money'
import { cn } from '@/lib/utils'

import { useListFilters } from '../hooks/use-list-filters'
import { useLoadMore } from '../hooks/use-load-more'
import { useTransactionPages } from '../hooks/use-transactions'
import { byDay, dayHeading } from '../lib/days'
import { apiFilterOf, isFiltered, noMatchesSentence } from '../lib/list-filters'
import { describe, formatActivityDate } from '../lib/transaction-meta'
import type { Transaction } from '../types'
import { ActionDrawer } from './action-drawer'
import { TransactionDrawer } from './transaction-drawer'
import { TransactionFilterBar } from './transaction-filter-bar'

/** Rows a page — a wide table shows far more than a phone's 20 at once. */
const PAGE_SIZE = 50
const COLUMNS = 7

const centsOf = (amount: string) => Math.round(Number(amount) * 100)

/** "+₱1.00" / "−₱1.00" / "₱0.00" — signed, from integer cents. */
function signed(cents: number): string {
  const sign = cents > 0 ? '+' : cents < 0 ? '−' : ''
  return `${sign}${formatMoney(Math.abs(cents) / 100)}`
}

/** "Thursday, Nov 12" — or "Today, Nov 13", where the phone says just "Today". */
function longDay(isoDate: string): string {
  const short = dayHeading(isoDate)
  const date = formatActivityDate(isoDate)
  if (short !== date) return `${short}, ${date}`
  const [year, month, day] = isoDate.split('-').map(Number)
  const weekday = new Date(year, month - 1, day).toLocaleDateString('en-US', { weekday: 'long' })
  return `${weekday}, ${date}`
}

/**
 * Transactions on a large screen (design/large-screen.html, rule 4): the
 * activity as a table — Date, Note, Type, Wallet, Allocation, By, Amount —
 * one `<tbody>` per day, led by a row with the day's net. A filter bar sits
 * above it, its state in the URL. 50 rows a page, loading more as the end
 * scrolls into view, like the phone feed.
 *
 * A row opens the entry's details drawer (a panel on the right at this
 * width) and stays highlighted while it's open, so it's clear what the panel
 * is about.
 *
 * Nothing at all → the page's empty state, with the first step. Nothing
 * matching → the filters stay, and the table holds one row naming them with
 * "Clear filters" (rule C).
 *
 * A day's net is of the rows loaded so far: a day cut by a page boundary
 * reads its full net once the next page arrives.
 */
export function TransactionTable() {
  const { filters, update, clear } = useListFilters()
  const filtered = isFiltered(filters)
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
  } = useTransactionPages(PAGE_SIZE, apiFilterOf(filters), { keepPrevious: true })
  const sentinel = useLoadMore<HTMLDivElement>({
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    fetchNextPage,
  })

  const { user } = useCurrentUser()
  const { wallets } = useWallets({ includeArchived: true })
  const { funds } = useFunds({ includeArchived: true })
  // Coloured as the Funds page colours them — by the ACTIVE allocations'
  // order — so a dot here matches the bars there. Archived ones are grey.
  const colors = useMemo(
    () => fundColors(funds.filter((fund) => fund.archived_at === null)),
    [funds],
  )
  const days = useMemo(() => byDay(transactions), [transactions])

  const [selected, setSelected] = useState<Transaction | null>(null)
  const [recording, setRecording] = useState<'income' | null>(null)

  const bar = (
    <TransactionFilterBar filters={filters} onChange={update} wallets={wallets} funds={funds} />
  )

  if (isLoading) {
    return (
      <div className="space-y-4">
        {bar}
        <div className="h-96 animate-pulse rounded-xl bg-muted" aria-hidden="true" />
      </div>
    )
  }

  if (isError && transactions.length === 0) {
    return (
      <div className="space-y-4">
        {bar}
        <Alert variant="destructive">
          <AlertDescription>
            {getApiErrorMessage(error, 'Could not load your transactions.')}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // No entries anywhere: filters would have nothing to narrow, so the page is
  // just the way to start.
  if (transactions.length === 0 && !filtered) {
    const hasWallet = wallets.some((wallet) => wallet.archived_at === null)
    return (
      <>
        <EmptyState
          icon={Receipt}
          title="No transactions yet"
          description={
            hasWallet
              ? 'Record an income or an expense and it shows up here.'
              : 'Add a wallet first — where your money sits — then record what comes in and goes out.'
          }
          action={
            hasWallet ? (
              <Button onClick={() => setRecording('income')}>Record income</Button>
            ) : (
              <Button nativeButton={false} render={<Link to="/wallets" />}>
                Add a wallet
              </Button>
            )
          }
        />
        <ActionDrawer
          action={recording}
          onOpenChange={(open) => {
            if (!open) setRecording(null)
          }}
        />
      </>
    )
  }

  const walletName = wallets.find((wallet) => wallet.id === filters.wallet)?.name
  const fundName = funds.find((fund) => fund.id === filters.fund)?.name
  const cell = 'truncate px-4 py-3'

  return (
    <div className="space-y-4">
      {bar}

      <div
        className={cn(
          'overflow-hidden card-surface text-card-foreground transition-opacity',
          isPlaceholderData && 'opacity-60',
        )}
        aria-busy={isPlaceholderData || undefined}
      >
        <table className="w-full table-fixed text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              {/* A fixed layout takes its widths from this row; Note gets the rest. */}
              <th scope="col" className="w-24 px-4 py-3 font-semibold">Date</th>
              <th scope="col" className="px-4 py-3 font-semibold">Note</th>
              <th scope="col" className="w-32 px-4 py-3 font-semibold">Type</th>
              <th scope="col" className="w-32 px-4 py-3 font-semibold">Wallet</th>
              <th scope="col" className="w-40 px-4 py-3 font-semibold">Allocation</th>
              {/* Who recorded it — the first column to give way on a narrow screen. */}
              <th scope="col" className="hidden w-24 px-4 py-3 font-semibold xl:table-cell">
                By
              </th>
              <th scope="col" className="w-36 px-4 py-3 text-right font-semibold">Amount</th>
            </tr>
          </thead>

          {transactions.length === 0 ? (
            <tbody>
              <tr>
                <td colSpan={COLUMNS} className="px-4 py-12 text-center">
                  <p className="font-semibold">
                    {noMatchesSentence(filters, { wallet: walletName, fund: fundName })}
                  </p>
                  <p className="mt-1 mb-4 text-muted-foreground">
                    Try another word, or widen the filters.
                  </p>
                  <Button variant="outline" onClick={clear}>
                    Clear filters
                  </Button>
                </td>
              </tr>
            </tbody>
          ) : (
            days.map((day) => {
              const net = day.entries.reduce((sum, entry) => sum + centsOf(entry.amount), 0)
              const heading = longDay(day.date)
              return (
                <tbody key={day.date}>
                  <tr className="border-b border-border bg-muted/60">
                    <th scope="rowgroup" colSpan={COLUMNS} className="px-4 py-2 text-left">
                      <div className="flex items-center justify-between gap-4 text-xs font-semibold">
                        <span>{heading}</span>
                        <span className="text-muted-foreground tabular-nums">
                          <span className="sr-only">Net </span>
                          {signed(net)}
                        </span>
                      </div>
                    </th>
                  </tr>
                  {day.entries.map((entry) => {
                    const { label } = describe(entry)
                    const cents = centsOf(entry.amount)
                    const reversed = entry.reversed_by_group_id !== null
                    const isSelected = selected?.id === entry.id
                    const color = entry.fund_id
                      ? (colors.get(entry.fund_id) ?? OTHER_FUND_COLOR)
                      : null
                    const by = entry.created_by_id
                      ? entry.created_by_id === user?.id
                        ? 'You'
                        : (entry.created_by_name ?? 'Someone')
                      : '—'
                    return (
                      <tr
                        key={entry.id}
                        // `relative` anchors the note's button, stretched over
                        // the whole row: one tab stop and one name per row,
                        // while the table keeps its row and cell semantics.
                        className={cn(
                          'relative border-b border-border transition-colors last:border-b-0',
                          isSelected ? 'bg-accent' : 'hover:bg-muted/50',
                        )}
                      >
                        <td className={cn(cell, 'text-muted-foreground')}>
                          {formatActivityDate(entry.date)}
                        </td>
                        <td className={cn(cell, 'font-semibold')}>
                          <button
                            type="button"
                            onClick={() => setSelected(entry)}
                            className={cn(
                              'w-full truncate text-left outline-none after:absolute after:inset-0 after:rounded-sm focus-visible:after:ring-3 focus-visible:after:ring-ring/50 focus-visible:after:ring-inset',
                              reversed && 'text-muted-foreground',
                            )}
                          >
                            {entry.note ?? (
                              <>
                                <span aria-hidden="true">—</span>
                                {/* Screen readers get what it was instead of a dash. */}
                                <span className="sr-only">{label}</span>
                              </>
                            )}
                          </button>
                        </td>
                        <td className={cell}>
                          {reversed ? `${label} · Reversed` : label}
                        </td>
                        <td className={cell}>
                          <span className="flex min-w-0 items-center gap-2">
                            <WalletAvatar walletId={entry.wallet_id} size="xs" />
                            <span className="truncate">{entry.wallet_name}</span>
                          </span>
                        </td>
                        <td className={cell}>
                          {entry.fund_name ? (
                            <span className="flex min-w-0 items-center gap-2">
                              <span
                                className="size-2 shrink-0 rounded-full"
                                style={{ background: color ?? OTHER_FUND_COLOR }}
                                aria-hidden="true"
                              />
                              <span className="truncate">{entry.fund_name}</span>
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className={cn(cell, 'hidden text-muted-foreground xl:table-cell')}>
                          {by}
                        </td>
                        <td
                          className={cn(
                            cell,
                            'text-right font-semibold tabular-nums',
                            reversed
                              ? 'text-muted-foreground line-through'
                              : cents > 0
                                ? 'text-success'
                                : 'text-destructive',
                          )}
                        >
                          {signed(cents)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              )
            })
          )}
        </table>
      </div>

      {transactions.length > 0 && (
        <div ref={sentinel} className="flex flex-col items-center gap-2 py-2">
          {isFetchNextPageError && <p className="text-sm text-destructive">Couldn't load more.</p>}
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
              {transactions.length === 1 ? 'entry' : 'entries'}
              {filtered && ' matching'}.
            </p>
          )}
        </div>
      )}

      <TransactionDrawer
        entry={selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null)
        }}
      />
    </div>
  )
}
