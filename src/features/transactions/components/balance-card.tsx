import { ChevronRight } from 'lucide-react'
import { Component, lazy, Suspense, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { formatMoney } from '@/lib/money'
import { cn } from '@/lib/utils'

import type { LedgerAction } from '../types'
import type { PocketsBurst } from './pockets-canvas'
import { QuickActions } from './quick-actions'

// three.js is its own chunk, fetched after the card has drawn.
const PocketsCanvas = lazy(() => import('./pockets-canvas'))

/** One allocation, as the card lists it and the wallet shows it — counted in the total or set aside. */
export type BalanceAllocation = {
  id: string
  name: string
  cents: number
  /** `fundColors`' colour — the same one it wears on Funds. */
  color: string
}

/** As many as the wallet has cards for; the rest are a link to Funds. */
const LISTED = 6

/**
 * The balance card of the design reference: a coloured band, the total in
 * large type with the centavos dimmed, and a row of round quick actions.
 *
 * Beside the figure, "Pockets" (2026-11-13, mockups `design/home-threejs.html`
 * and `-desktop.html`): the app icon in 3D, one card per allocation peeking
 * out of the wallet as far as its balance says, sinking red below zero, with
 * coins that split like an income just recorded. It is a picture of the list
 * under the figure — every allocation the total counts, with its amount, each
 * opening its own page — so it is `aria-hidden` and nothing is lost without
 * it (no WebGL, its chunk not loaded yet). From `lg` the wallet takes the
 * card's right half, and hovering an allocation lifts its card out.
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
  allocations = [],
  burst = null,
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
  /** Every allocation, counted or set aside, in the API's order. */
  allocations?: BalanceAllocation[]
  /** An income just recorded, for the wallet to play as coins. */
  burst?: PocketsBurst | null
  /** False before the first wallet: nothing can be recorded yet. */
  hasWallet?: boolean
  onAction: (action: LedgerAction) => void
}) {
  const cardRef = useRef<HTMLElement>(null)
  const [highlightId, setHighlightId] = useState<string | null>(null)

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

  // An empty allocation has no card in the wallet, so it isn't listed either.
  const holding = useMemo(() => allocations.filter((allocation) => allocation.cents !== 0), [allocations])
  const listed = useMemo(() => holding.slice(0, LISTED), [holding])
  const unlisted = holding.length - listed.length

  return (
    <section ref={cardRef} className="overflow-hidden rounded-xl bg-secondary text-secondary-foreground">
      <div className="bg-primary px-5 py-2 text-xs font-medium text-primary-foreground dark:bg-secondary-accent/15 dark:text-secondary-accent">
        Total balance{allocationCount > 0 && ` · ${scope}`}
      </div>

      {/* A phone: the figure with the wallet to its right, then the list and
          the actions across the width. From lg: everything on the left, the
          wallet down the whole right half. */}
      <div className="grid grid-cols-[minmax(0,1fr)_8.5rem] gap-x-3 px-5 pt-4 pb-5 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,0.95fr)] lg:gap-x-6">
        <div className="col-start-1 row-start-1 min-w-0">
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
        </div>

        <SceneBoundary>
          <Suspense fallback={null}>
            <PocketsCanvas
              items={listed}
              burst={burst}
              highlightId={highlightId}
              pointerArea={cardRef}
              className="col-start-2 row-start-1 -mt-3 -mr-2 h-32 lg:row-span-3 lg:-mt-2 lg:-mr-3 lg:-mb-2 lg:h-auto lg:min-h-60"
            />
          </Suspense>
        </SceneBoundary>

        {listed.length > 0 && (
          <ul className="col-span-2 row-start-2 mt-3 grid grid-cols-2 gap-x-4 gap-y-0.5 lg:col-span-1 lg:mt-4">
            {listed.map((allocation) => (
              <li key={allocation.id} className="min-w-0">
                <Link
                  to={`/funds/allocations/${allocation.id}`}
                  state={{ from: '/' }}
                  onPointerEnter={() => setHighlightId(allocation.id)}
                  onPointerLeave={() => setHighlightId(null)}
                  onFocus={() => setHighlightId(allocation.id)}
                  onBlur={() => setHighlightId(null)}
                  className="-mx-2 flex items-center gap-2 rounded-lg px-2 py-1 text-xs outline-none hover:bg-secondary-foreground/8 focus-visible:ring-3 focus-visible:ring-ring/50 lg:text-[13px]"
                >
                  <span
                    className="size-2 shrink-0 rounded-[3px]"
                    style={{ background: allocation.cents < 0 ? 'var(--secondary-negative)' : allocation.color }}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1 truncate text-secondary-foreground/75">{allocation.name}</span>
                  <span
                    className={cn(
                      'shrink-0 font-semibold tabular-nums',
                      allocation.cents < 0 && 'text-secondary-negative',
                    )}
                  >
                    {allocation.cents < 0 ? '−' : ''}
                    {formatMoney(Math.abs(allocation.cents) / 100)}
                  </span>
                </Link>
              </li>
            ))}
            {unlisted > 0 && (
              <li className="col-span-2">
                <Link
                  to="/funds?tab=allocations"
                  className="inline-block rounded-md py-1 text-xs font-semibold text-secondary-accent outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {unlisted} more {unlisted === 1 ? 'allocation' : 'allocations'}
                  <ChevronRight className="ml-0.5 inline size-3.5 align-[-2px]" aria-hidden="true" />
                </Link>
              </li>
            )}
          </ul>
        )}

        <QuickActions
          className="col-span-2 row-start-3 mt-5 lg:col-span-1"
          onAction={onAction}
          disabled={!hasWallet}
        />
      </div>
    </section>
  )
}

/**
 * The wallet is a picture of the list beside it: if its chunk fails to load
 * (offline before it was ever cached), the card goes on without it.
 */
class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}
