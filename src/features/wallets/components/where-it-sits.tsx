import { useMemo } from 'react'
import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

import { fundColors, useFunds } from '@/features/funds'
import { formatMoney } from '@/lib/money'
import { cn } from '@/lib/utils'

import { useWalletBreakdowns } from '../hooks/use-wallet-breakdowns'
import { useWallets } from '../hooks/use-wallets'
import { WALLET_TYPE_META } from '../lib/wallet-meta'
import { WalletAvatar } from './wallet-avatar'

const centsOf = (amount: string) => Math.round(Number(amount) * 100)

/**
 * Home's "Where it sits" (design/large-screen.html, 2026-11-13): one cell per
 * active wallet — name · type, balance, and the same thin stacked bar the
 * Funds rows draw, in each allocation's own colour. The balance card says how
 * much; this says where, which is the app's whole idea, without a trip to
 * Funds.
 *
 * Built from the same cached queries as the Funds page (wallets, and the
 * funds' holdings turned inside out), so the two can't disagree and opening
 * Funds is instant. Nothing at all with no wallets — the setup checklist
 * says what to do then.
 */
export function WhereItSits({ className }: { className?: string }) {
  const { wallets } = useWallets()
  const breakdowns = useWalletBreakdowns()
  const { funds } = useFunds()
  const colors = useMemo(() => fundColors(funds), [funds])

  if (wallets.length === 0) return null

  return (
    <section
      className={cn('space-y-3 card-surface p-4 text-card-foreground', className)}
      aria-labelledby="where-heading"
    >
      <div className="flex items-baseline justify-between gap-2">
        <h2 id="where-heading" className="text-sm font-semibold">
          Where it sits
        </h2>
        <Link
          to="/funds?tab=wallets"
          className="inline-flex items-center gap-0.5 text-sm font-medium text-primary hover:underline"
        >
          All wallets
          <ChevronRight className="size-4" aria-hidden="true" />
        </Link>
      </div>

      {/* Up to four a row; a fifth wallet wraps rather than squeezing the
          figures. Each cell opens the wallet, as its Funds row does. */}
      <ul className="-mx-2 grid grid-cols-2 gap-1 sm:grid-cols-4">
        {wallets.map((wallet) => {
          // Only what's actually held draws: a negative pair, borrowed
          // against, has no share of anything.
          const parts = (breakdowns.get(wallet.id) ?? []).filter((item) => centsOf(item.amount) > 0)
          const held = parts.map((item) => centsOf(item.amount))
          const total = held.reduce((sum, cents) => sum + cents, 0)

          return (
            <li key={wallet.id} className="min-w-0">
              <Link
                to={`/funds/wallets/${wallet.id}`}
                state={{ from: '/' }}
                className="grid gap-1.5 rounded-lg px-2 py-2 transition-colors outline-none hover:bg-muted/60 focus-visible:bg-muted/60"
              >
                <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                  <WalletAvatar wallet={wallet} size="xs" />
                  <span className="truncate">
                    {wallet.name} · {WALLET_TYPE_META[wallet.type].label}
                  </span>
                </span>
                <span
                  className={cn(
                    'truncate text-[17px] font-semibold tabular-nums',
                    Number(wallet.balance) < 0 && 'text-destructive',
                  )}
                >
                  {formatMoney(wallet.balance)}
                </span>
                <span className="flex h-1.5 gap-px overflow-hidden rounded-full bg-muted" aria-hidden="true">
                  {parts.map((item, index) => (
                    <i
                      key={item.id}
                      className="block h-full"
                      style={{ width: `${(held[index] / total) * 100}%`, backgroundColor: colors.get(item.id) }}
                    />
                  ))}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
