import { formatMoney } from '@/lib/money'

import { ACTION_META } from '../lib/transaction-meta'
import type { LedgerAction } from '../types'

const ACTIONS: LedgerAction[] = ['income', 'expense', 'reallocation', 'transfer']

/**
 * The balance card of the design reference: a coloured band, the total in
 * large type with the centavos dimmed, and a row of round quick actions.
 *
 * Drawn in theme tokens — the band in `primary`, the card in the navy
 * `secondary` — not the reference's literal orange and black.
 */
export function BalanceCard({
  total,
  walletCount,
  onAction,
}: {
  /** Decimal string — the sum of the active wallets. */
  total: string
  walletCount: number
  onAction: (action: LedgerAction) => void
}) {
  const formatted = formatMoney(total)
  // Split at the decimal point so the centavos can be dimmed, as the reference
  // does ("$12,024.54"). Every currency this app formats has one.
  const point = formatted.lastIndexOf('.')
  const [whole, cents] =
    point === -1 ? [formatted, ''] : [formatted.slice(0, point), formatted.slice(point)]

  return (
    <section className="overflow-hidden rounded-xl bg-secondary text-secondary-foreground">
      <div className="bg-primary px-5 py-2 text-xs font-medium text-primary-foreground">
        Total balance · {walletCount} {walletCount === 1 ? 'wallet' : 'wallets'}
      </div>

      <div className="px-5 pt-4 pb-5">
        <p className="text-4xl font-semibold tracking-tight tabular-nums">
          {whole}
          <span className="text-secondary-foreground/50">{cents}</span>
        </p>

        <ul className="mt-5 grid grid-cols-4 gap-2">
          {ACTIONS.map((action) => {
            const { label, icon: Icon } = ACTION_META[action]
            return (
              <li key={action}>
                <button
                  type="button"
                  onClick={() => onAction(action)}
                  className="group flex w-full flex-col items-center gap-1.5 rounded-xl py-1 text-xs outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <span className="grid size-11 place-items-center rounded-full bg-secondary-foreground/15 transition-colors group-hover:bg-secondary-foreground/25">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  {label}
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
