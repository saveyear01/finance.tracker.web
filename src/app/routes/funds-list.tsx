import { ChartPie, Wallet } from 'lucide-react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useFunds } from '@/features/funds'
import { useWallets } from '@/features/wallets'
import { formatMoney } from '@/lib/money'
import { cn } from '@/lib/utils'

import { AllocationsTab } from './funds-allocations-tab'
import type { FundsTab } from './funds-first-row'
import { WalletsTab } from './funds-wallets-tab'

const plural = (count: number, one: string, many: string) =>
  `${count} ${count === 1 ? one : many}`

/** The Wallets | Allocations switch, on its own so an empty page can keep it. */
export function FundsTabsList({ className }: { className?: string }) {
  return (
    <TabsList className={cn('h-10! w-full', className)}>
      <TabsTrigger value="wallets">
        <Wallet />
        Wallets
      </TabsTrigger>
      <TabsTrigger value="allocations">
        <ChartPie />
        Allocations
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
 * integer cents — with every allocation counted, the number Home shows; when
 * some are left out of Home's total, it says how much Home counts.
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
  const centsOf = (amount: string) => Math.round(Number(amount) * 100)
  const cents = wallets.reduce((sum, wallet) => sum + centsOf(wallet.balance), 0)
  // What Home's balance card shows — said here so the two figures explain
  // each other rather than just differing (2026-11-11).
  const counted = funds.filter((fund) => fund.in_total)
  const countedCents = counted.reduce((sum, fund) => sum + centsOf(fund.balance), 0)

  return (
    <div className="space-y-4">
      <section className="card-surface p-4 text-card-foreground">
        <p className="text-sm text-muted-foreground">
          Total across {plural(wallets.length, 'wallet', 'wallets')} ·{' '}
          {plural(funds.length, 'allocation', 'allocations')}
        </p>
        <p className="figure-lg">{isLoading ? '…' : formatMoney(cents / 100)}</p>
        {!isLoading && counted.length < funds.length && (
          <p className="mt-0.5 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{formatMoney(countedCents / 100)}</span> of it counted
            on Home
          </p>
        )}
      </section>

      <Tabs value={tab} onValueChange={(value) => onTabChange(value as FundsTab)} className="gap-4">
        <FundsTabsList />
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
