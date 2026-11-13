import { WalletAvatar } from '@/features/wallets'
import { formatMoney } from '@/lib/money'
import { cn } from '@/lib/utils'

import { describe, formatActivityDate } from '../lib/transaction-meta'
import type { Transaction } from '../types'

/**
 * One ledger entry as a card: what it was, where, when, and the signed
 * amount. Shared by Home's Recent Activity and the Transactions page, so an
 * entry reads the same in both.
 *
 * The note, when there is one, is the title ("Groceries"); what kind of entry
 * it was moves to the line below. `showDate` is off where the list already
 * groups rows under date headings.
 *
 * A reversed (deleted) entry stays in the list, struck through: the history
 * reads as it happened, and its reversal sits further up.
 *
 * Who recorded it isn't shown here — only in the entry's drawer.
 *
 * With `onSelect` the whole card is a button that opens the entry.
 */
export function TransactionRow({
  entry,
  showDate = true,
  onSelect,
}: {
  entry: Transaction
  showDate?: boolean
  onSelect?: (entry: Transaction) => void
}) {
  const { label, icon: Icon } = describe(entry)
  const incoming = Number(entry.amount) > 0
  const reversed = entry.reversed_by_group_id !== null
  const before = [entry.note ? label : null, entry.fund_name].filter(Boolean).join(' · ')
  const date = showDate ? formatActivityDate(entry.date) : null

  const body = (
    <>
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-muted">
        <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className={cn('truncate font-medium', reversed && 'text-muted-foreground')}>
          {entry.note ?? label}
        </p>
        {/* The wallet carries its logo, small, so it can be spotted down
            the list; the big circle keeps saying what kind of entry it is. */}
        <p className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
          <span className="truncate">
            {reversed && <span className="font-medium text-foreground">Reversed · </span>}
            {before && `${before} · `}
          </span>
          <WalletAvatar walletId={entry.wallet_id} size="xs" className="size-4" />
          <span className="shrink-0">{entry.wallet_name}</span>
          {date && <span className="truncate">· {date}</span>}
        </p>
      </div>
      <span
        className={cn(
          'shrink-0 font-semibold tabular-nums',
          reversed
            ? 'text-muted-foreground line-through'
            : incoming
              ? 'text-success'
              : 'text-destructive',
        )}
      >
        {incoming ? '+' : '−'}
        {formatMoney(Math.abs(Number(entry.amount)))}
      </span>
    </>
  )

  const card =
    'flex w-full items-center gap-3 card-surface p-3 text-left text-card-foreground'

  return (
    <li>
      {onSelect ? (
        <button
          type="button"
          onClick={() => onSelect(entry)}
          className={cn(
            card,
            'transition-colors hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
          )}
        >
          {body}
        </button>
      ) : (
        <div className={card}>{body}</div>
      )}
    </li>
  )
}
