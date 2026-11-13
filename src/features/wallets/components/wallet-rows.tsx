import { useMemo } from 'react'
import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { fundColors, useFunds } from '@/features/funds'
import { formatMoney } from '@/lib/money'
import { wholePercents } from '@/lib/percents'
import { cn } from '@/lib/utils'

import { useWalletBreakdowns } from '../hooks/use-wallet-breakdowns'
import { WALLET_TYPE_META } from '../lib/wallet-meta'
import type { Wallet } from '../types'

const centsOf = (amount: string) => Math.round(Number(amount) * 100)

/**
 * Wallets as rows in one card (2026-11-11, replacing the cards that opened on
 * an unmarked tap, and the table): the name, type and balance, and under
 * them what the wallet holds by allocation — always visible, as a thin
 * stacked bar in each allocation's own colour with the biggest two named.
 * That split is the app's whole idea; it shouldn't take a tap to find.
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
        const { label, icon: Icon } = WALLET_TYPE_META[wallet.type]
        const archived = wallet.archived_at !== null
        const selected = wallet.id === selectedId
        const parts = (breakdowns.get(wallet.id) ?? []).filter((item) => centsOf(item.amount) > 0)
        const held = parts.map((item) => centsOf(item.amount))
        const total = held.reduce((sum, cents) => sum + cents, 0)
        const percents = total > 0 ? wholePercents(held, total) : []
        const named = parts
          .slice(0, 2)
          .map((item, index) => `${item.label} ${percents[index] === 0 ? '<1' : percents[index]}%`)
          .join(' · ')
        const summary = parts.length === 0 ? 'Empty' : parts.length > 2 ? `${named} · +${parts.length - 2}` : named

        return (
          <li key={wallet.id} className="border-border not-first:border-t">
            <Link
              to={`/funds/wallets/${wallet.id}`}
              state={{ from }}
              aria-current={selected ? 'page' : undefined}
              className={cn(
                'grid grid-cols-[2.25rem_minmax(0,1fr)_auto_1rem] items-center gap-x-3 gap-y-1.5 px-4 py-3 transition-colors outline-none hover:bg-muted/60 focus-visible:bg-muted/60',
                archived && 'opacity-60',
                selected &&
                  'relative bg-accent before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-primary hover:bg-accent focus-visible:bg-accent',
              )}
            >
              <span className="grid size-9 place-items-center rounded-full bg-muted" aria-hidden="true">
                <Icon className="size-4 text-muted-foreground" />
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-2">
                  <span className="truncate font-medium">{wallet.name}</span>
                  {archived && <Badge variant="secondary">Archived</Badge>}
                </span>
                <span className="block text-xs text-muted-foreground">{label}</span>
              </span>
              <span
                className={cn('font-semibold tabular-nums', Number(wallet.balance) < 0 && 'text-destructive')}
              >
                {formatMoney(wallet.balance)}
              </span>
              <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />

              {total > 0 && (
                <span className="col-start-2 col-end-4 flex h-1.5 gap-px overflow-hidden rounded-full bg-muted" aria-hidden="true">
                  {parts.map((item, index) => (
                    <i
                      key={item.id}
                      className="block h-full"
                      style={{ width: `${(held[index] / total) * 100}%`, backgroundColor: colors.get(item.id) }}
                    />
                  ))}
                </span>
              )}
              <span className="col-start-2 col-end-4 -mt-0.5 truncate text-xs text-muted-foreground">{summary}</span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
