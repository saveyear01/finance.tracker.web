import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

import { formatMoney } from '@/lib/money'

import type { LedgerAction } from '../types'
import { QuickActions } from './quick-actions'

/**
 * The balance card of the design reference: a coloured band, the total in
 * large type with the centavos dimmed, and a row of round quick actions.
 *
 * The total is the allocations that COUNT (each has a "Count in total"
 * setting — money set aside can be left out), so the band says how many of
 * them it is: "4 of 6 allocations" makes a total smaller than the wallets
 * add up to read as a choice, not a bug.
 *
 * When some are left out, a line under the figure says how much they hold
 * and opens the allocations, where "Count in total" is changed (2026-11-11).
 *
 * With no wallet yet (a household's first run) the actions are dimmed and
 * the line under the figure says what comes first (2026-11-13).
 *
 * Drawn in theme tokens — the band in `primary`, the card in the ink-teal
 * `secondary`. In dark mode the band steps down to a mint tint of the card,
 * so the figure, not the label, is the brightest thing on it.
 */
export function BalanceCard({
  total,
  counted,
  allocationCount,
  setAsideCents,
  hasWallet = true,
  onAction,
}: {
  /** Decimal string — the sum of the allocations that count. */
  total: string
  /** How many allocations are in it… */
  counted: number
  /** …out of how many active ones. */
  allocationCount: number
  /** What the allocations left out hold, in cents. */
  setAsideCents: number
  /** False before the first wallet: nothing can be recorded yet. */
  hasWallet?: boolean
  onAction: (action: LedgerAction) => void
}) {
  const noun = allocationCount === 1 ? 'allocation' : 'allocations'
  const scope =
    counted === allocationCount
      ? `${allocationCount} ${noun}`
      : `${counted} of ${allocationCount} ${noun}`
  const formatted = formatMoney(total)
  // Split at the decimal point so the centavos can be dimmed, as the reference
  // does ("$12,024.54"). Every currency this app formats has one.
  const point = formatted.lastIndexOf('.')
  const [whole, cents] =
    point === -1 ? [formatted, ''] : [formatted.slice(0, point), formatted.slice(point)]

  return (
    <section className="overflow-hidden rounded-xl bg-secondary text-secondary-foreground">
      <div className="bg-primary px-5 py-2 text-xs font-medium text-primary-foreground dark:bg-secondary-accent/15 dark:text-secondary-accent">
        Total balance{allocationCount > 0 && ` · ${scope}`}
      </div>

      <div className="px-5 pt-4 pb-5">
        <p className="figure-xl">
          {whole}
          <span className="text-secondary-foreground/50">{cents}</span>
        </p>
        {!hasWallet && (
          <p className="mt-1 text-xs text-secondary-foreground/80">Add a wallet to start recording</p>
        )}
        {counted < allocationCount && setAsideCents !== 0 && (
          <Link
            to="/funds?tab=allocations"
            // Plain inline text, so on a narrow phone it wraps like a sentence
            // rather than holding the card open at its full length.
            className="mt-1 inline-block rounded-md text-xs font-semibold text-secondary-accent outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {setAsideCents > 0 ? '+' : '−'} {formatMoney(Math.abs(setAsideCents) / 100)} set aside in{' '}
            {allocationCount - counted} {allocationCount - counted === 1 ? 'allocation' : 'allocations'}
            <ChevronRight className="ml-0.5 inline size-3.5 align-[-2px]" aria-hidden="true" />
          </Link>
        )}

        <QuickActions className="mt-5" onAction={onAction} disabled={!hasWallet} />
      </div>
    </section>
  )
}
