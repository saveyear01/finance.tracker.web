import { ChartPie, Wallet } from 'lucide-react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useFunds } from '@/features/funds'
import { useWallets } from '@/features/wallets'
import { formatMoney } from '@/lib/money'
import { cn } from '@/lib/utils'

import { AllocationsTab } from './funds-allocations-tab'
import type { FundsTab } from './funds-first-row'
import { WalletsTab } from './funds-wallets-tab'

/** The Wallets | Allocations switch, on its own so an empty page can keep it.
 * With counts, each tab says how many it lists ("Wallets 6"). */
export function FundsTabsList({
  className,
  walletCount,
  allocationCount,
}: {
  className?: string
  walletCount?: number
  allocationCount?: number
}) {
  const count = (n?: number) =>
    n === undefined ? null : <span className="font-medium text-muted-foreground tabular-nums">{n}</span>
  return (
    <TabsList className={cn('h-10! w-full', className)}>
      <TabsTrigger value="wallets">
        <Wallet />
        Wallets {count(walletCount)}
      </TabsTrigger>
      <TabsTrigger value="allocations">
        <ChartPie />
        Allocations {count(allocationCount)}
      </TabsTrigger>
    </TabsList>
  )
}

/**
 * The Funds list: where the money sits (Wallets) and what it's for
 * (Allocations), as two tabs under one total. On a phone it is the /funds
 * page; on a big screen it is also the left pane beside an open wallet or
 * allocation, with that row marked (`selectedId`).
 *
 * One total above both: the two views are the same money summed two ways,
 * so they always come to the same figure. It's summed from the wallets in
 * integer cents.
 *
 * Minimal since 2026-11-13 (mockup `design/funds-wallets-minimal.html` — the
 * user found it "redundant and overwhelming"): the label and the figure, no
 * card. The counts are on the tabs; how much Home counts is the Allocations
 * tab's "Counted on Home" section, so it isn't said here as well.
 *
 * The tab is the caller's: the /funds page keeps it in `?tab=`, a detail
 * page knows it from its own route, and switching from one opens the other
 * tab's first row.
 */
export function FundsList({
  tab,
  selectedId,
  onTabChange,
}: {
  tab: FundsTab
  selectedId?: string
  onTabChange: (tab: FundsTab) => void
}) {
  // The active lists — the same queries the tabs make, so no extra fetch.
  const { wallets, isLoading } = useWallets()
  const { funds } = useFunds()
  const cents = wallets.reduce((sum, wallet) => sum + Math.round(Number(wallet.balance) * 100), 0)
  const formatted = formatMoney(cents / 100)
  // The centavos dimmed, as on Home's balance card.
  const point = formatted.lastIndexOf('.')
  const [whole, centavos] =
    point === -1 ? [formatted, ''] : [formatted.slice(0, point), formatted.slice(point)]

  return (
    <div className="space-y-4">
      <section className="px-1">
        <p className="text-sm text-muted-foreground">Total</p>
        <p className="figure-lg">
          {isLoading ? (
            '…'
          ) : (
            <>
              {whole}
              <span className="font-medium text-muted-foreground">{centavos}</span>
            </>
          )}
        </p>
      </section>

      <Tabs value={tab} onValueChange={(value) => onTabChange(value as FundsTab)} className="gap-4">
        <FundsTabsList
          walletCount={isLoading ? undefined : wallets.length}
          allocationCount={isLoading ? undefined : funds.length}
        />
        <TabsContent value="wallets">
          <WalletsTab selectedId={tab === 'wallets' ? selectedId : undefined} />
        </TabsContent>
        <TabsContent value="allocations">
          <AllocationsTab selectedId={tab === 'allocations' ? selectedId : undefined} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
