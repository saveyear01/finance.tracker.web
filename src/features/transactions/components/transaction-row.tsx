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
  const details = [
    entry.note ? label : null,
    entry.fund_name,
    entry.wallet_name,
    showDate ? formatActivityDate(entry.date) : null,
  ].filter(Boolean)

  const body = (
    <>
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-muted">
        <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className={cn('truncate font-medium', reversed && 'text-muted-foreground')}>
          {entry.note ?? label}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {reversed && <span className="font-medium text-foreground">Reversed · </span>}
          {details.join(' · ')}
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
    'flex w-full items-center gap-3 rounded-xl border border-border bg-card p-3 text-left text-card-foreground'

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
