import { Component, lazy, Suspense, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { formatMoney } from '@/lib/money'

import type { LedgerAction } from '../types'
import type { PocketsBurst } from './pockets-canvas'
import { QuickActions } from './quick-actions'

// three.js is its own chunk, fetched after the card has drawn.
const PocketsCanvas = lazy(() => import('./pockets-canvas'))

/** One allocation, as the wallet shows it — counted in the total or set aside. */
export type BalanceAllocation = {
  id: string
  name: string
  cents: number
  /** `fundColors`' colour — the same one it wears on Funds. */
  color: string
}

/** As many as the wallet has cards for. */
const SHOWN = 6

const money = (cents: number) => `${cents < 0 ? '−' : ''}${formatMoney(Math.abs(cents) / 100)}`

/**
 * Home's balance card, minimal since 2026-11-13 (mockup
 * `design/home-minimal.html` — the user found Home overwhelming): the total,
 * the four quick actions and, beside them, "Pockets" — the app icon in 3D,
 * one card per allocation peeking out of the wallet as far as its balance
 * says, sinking red below zero, with coins that split like an income just
 * recorded (mockups `design/home-threejs*.html`).
 *
 * Each fact said once: no band ("1 of 8 allocations"), no list of
 * allocations under the figure (the wallet's cards are that list) and no
 * "set aside" line — Funds → Allocations has both, and tapping the wallet
 * goes there. On a desktop, pointing at a card lifts it and names it with
 * its amount. The wallet is `aria-hidden`; a screen reader gets the same
 * allocations as a hidden list, so nothing is lost without the picture (no
 * WebGL, its chunk not loaded yet).
 *
 * The total is the allocations that COUNT (each has a "Count in total"
 * setting), worked out by the caller.
 *
 * With no wallet yet (a household's first run) the actions are dimmed and
 * a line under the figure says what comes first.
 */
export function BalanceCard({
  total,
  allocations = [],
  burst = null,
  hasWallet = true,
  onAction,
}: {
  /** Decimal string — the sum of the allocations that count. */
  total: string
  /** Every allocation, counted or set aside, in the API's order. */
  allocations?: BalanceAllocation[]
  /** An income just recorded, for the wallet to play as coins. */
  burst?: PocketsBurst | null
  /** False before the first wallet: nothing can be recorded yet. */
  hasWallet?: boolean
  onAction: (action: LedgerAction) => void
}) {
  const cardRef = useRef<HTMLElement>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const formatted = formatMoney(total)
  // Split at the decimal point so the centavos can be dimmed.
  const point = formatted.lastIndexOf('.')
  const [whole, cents] =
    point === -1 ? [formatted, ''] : [formatted.slice(0, point), formatted.slice(point)]

  // An empty allocation has no card in the wallet.
  const shown = useMemo(
    () => allocations.filter((allocation) => allocation.cents !== 0).slice(0, SHOWN),
    [allocations],
  )
  const hovered = shown.find((allocation) => allocation.id === hoveredId)

  return (
    <section
      ref={cardRef}
      aria-labelledby="balance-heading"
      className="overflow-hidden rounded-xl bg-secondary text-secondary-foreground"
    >
      {/* A phone: the figure with the wallet to its right, the actions across
          the width under both. From lg: the figure and the actions on the
          left, the wallet down the right half. */}
      <div className="grid grid-cols-[minmax(0,1fr)_8.5rem] items-center gap-x-3 p-5 lg:grid-cols-[minmax(0,1fr)_minmax(14rem,0.9fr)] lg:gap-x-6 lg:p-7">
        <div className="col-start-1 row-start-1 min-w-0">
          <h2 id="balance-heading" className="text-sm text-secondary-foreground/70">
            Total balance
          </h2>
          <p className="figure-xl mt-1 lg:text-5xl">
            {whole}
            <span className="text-secondary-foreground/45">{cents}</span>
          </p>
          {!hasWallet && (
            <p className="mt-1 text-xs text-secondary-foreground/80">Add a wallet to start recording</p>
          )}
          {shown.length > 0 && (
            <ul className="sr-only">
              {shown.map((allocation) => (
                <li key={allocation.id}>
                  {allocation.name}: {money(allocation.cents)}
                </li>
              ))}
            </ul>
          )}
        </div>

        <SceneBoundary>
          <Suspense fallback={null}>
            <Link
              to="/allocations"
              aria-label="Allocations"
              className="relative col-start-2 row-start-1 -my-2 -mr-2 block h-32 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50 lg:row-span-2 lg:-my-3 lg:-mr-3 lg:h-60"
            >
              <PocketsCanvas
                items={shown}
                burst={burst}
                onHover={setHoveredId}
                pointerArea={cardRef}
                className="h-full w-full"
              />
              {hovered && (
                <span
                  className="pointer-events-none absolute top-2 left-1/2 -translate-x-1/2 rounded-full bg-secondary-foreground px-3 py-1 text-xs font-semibold whitespace-nowrap text-secondary"
                  aria-hidden="true"
                >
                  {hovered.name} · {money(hovered.cents)}
                </span>
              )}
            </Link>
          </Suspense>
        </SceneBoundary>

        <QuickActions
          className="col-span-2 row-start-2 mt-5 lg:col-span-1 lg:mt-6 lg:max-w-sm"
          onAction={onAction}
          disabled={!hasWallet}
        />
      </div>
    </section>
  )
}

/**
 * The wallet is a picture of the hidden list beside it: if its chunk fails
 * to load (offline before it was ever cached), the card goes on without it.
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
