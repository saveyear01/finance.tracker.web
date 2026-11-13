import { useMemo } from 'react'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { fundColors, useFunds } from '@/features/funds'
import { formatMoney } from '@/lib/money'
import { wholePercents } from '@/lib/percents'
import { cn } from '@/lib/utils'

import { useWalletBreakdowns } from '../hooks/use-wallet-breakdowns'
import { WALLET_TYPE_META } from '../lib/wallet-meta'
import type { Wallet } from '../types'
import { WalletAvatar } from './wallet-avatar'

const centsOf = (amount: string) => Math.round(Number(amount) * 100)

/**
 * Wallets as rows in one card: the logo (or the type's icon), the name and
 * the balance, and under the name what the wallet holds by allocation as a
 * thin stacked bar in each allocation's own colour. That split is the app's
 * whole idea; it shouldn't take a tap to find.
 *
 * Minimal since 2026-11-13 (mockup `design/funds-wallets-minimal.html`): each
 * fact said once. No type under the name (the icon says it), no "Wants 41% ·
 * Savings 28%" line (the bar says it — the figures are on the wallet's page),
 * no "Empty" (an empty wallet has no bar and a dimmed balance), no chevron
 * (the whole row is the link; hover and press show it).
 *
 * Only what's actually held draws (a negative pair, borrowed against, has
 * no share of anything). A row opens the wallet's own page; no menu.
 *
 * `selectedId` marks the wallet open beside the list on a big screen (the
 * split view): an accent row with a primary bar on its left edge, and
 * `aria-current` so a screen reader hears which one it is.
 */
export function WalletRows({
  wallets,
  from,
  selectedId,
}: {
  wallets: Wallet[]
  from: string
  selectedId?: string
}) {
  const breakdowns = useWalletBreakdowns()
  const { funds } = useFunds()
  const colors = useMemo(() => fundColors(funds), [funds])

  return (
    <ul className="overflow-hidden card-surface text-card-foreground">
      {wallets.map((wallet) => {
        const { label } = WALLET_TYPE_META[wallet.type]
        const archived = wallet.archived_at !== null
        const selected = wallet.id === selectedId
        const parts = (breakdowns.get(wallet.id) ?? []).filter((item) => centsOf(item.amount) > 0)
        const held = parts.map((item) => centsOf(item.amount))
        const total = held.reduce((sum, cents) => sum + cents, 0)
        const balance = centsOf(wallet.balance)
        // What the bar shows, said for a screen reader (the bar is hidden from it).
        const percents = total > 0 ? wholePercents(held, total) : []
        const split =
          parts.length === 0
            ? 'Empty'
            : parts.map((item, index) => `${item.label} ${percents[index] === 0 ? 'under 1' : percents[index]}%`).join(', ')

        return (
          <li key={wallet.id} className="border-border not-first:border-t">
            <Link
              to={`/funds/wallets/${wallet.id}`}
              state={{ from }}
              aria-current={selected ? 'page' : undefined}
              className={cn(
                'flex min-h-16 items-center gap-3 px-4 py-3 transition-colors outline-none hover:bg-muted/60 focus-visible:bg-muted/60 active:bg-muted',
                archived && 'opacity-60',
                selected &&
                  'relative bg-accent before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-primary hover:bg-accent focus-visible:bg-accent',
              )}
            >
              <WalletAvatar wallet={wallet} />
              <span className="grid min-w-0 flex-1 gap-1.5">
                <span className="flex items-center gap-2">
                  <span className="truncate font-medium">{wallet.name}</span>
                  {/* The type, for a screen reader: sighted users have the icon. */}
                  <span className="sr-only">, {label}. {split}.</span>
                  {archived && <Badge variant="secondary">Archived</Badge>}
                </span>
                {total > 0 && (
                  <span className="flex h-1 max-w-52 gap-px overflow-hidden rounded-full bg-muted" aria-hidden="true">
                    {parts.map((item, index) => (
                      <i
                        key={item.id}
                        className="block h-full"
                        style={{ width: `${(held[index] / total) * 100}%`, backgroundColor: colors.get(item.id) }}
                      />
                    ))}
                  </span>
                )}
              </span>
              <span
                className={cn(
                  'shrink-0 font-semibold tabular-nums',
                  balance < 0 && 'text-destructive',
                  balance === 0 && 'font-medium text-muted-foreground',
                )}
              >
                {formatMoney(wallet.balance)}
              </span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
