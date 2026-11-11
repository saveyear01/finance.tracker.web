import { ChartPie, Wallet } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useFunds } from '@/features/funds'
import { useWallets } from '@/features/wallets'
import { formatMoney } from '@/lib/money'

import { AllocationsTab } from './funds-allocations-tab'
import { WalletsTab } from './funds-wallets-tab'

type FundsTab = 'wallets' | 'allocations'

const plural = (count: number, one: string, many: string) =>
  `${count} ${count === 1 ? one : many}`

/**
 * Funds: where the money sits (Wallets) and what it's for (Allocations), as
 * two tabs of one page.
 *
 * One total above both: the two views are the same money summed two ways,
 * so they always come to the same figure. It's summed from the wallets in
 * integer cents — with every allocation counted, the number Home shows; when
 * some are left out of Home's total, it says how much Home counts.
 *
 * A row on either tab opens that wallet's or allocation's own page
 * (`/funds/wallets/:id`, `/funds/allocations/:id`, added 2026-11-11). One
 * column at every width, like the rest of the app's lists.
 *
 * The tab lives in the URL (`?tab=allocations`), so a link can open either
 * one and Back returns to it; Wallets when there's none. Switching replaces
 * the history entry rather than adding one — flipping tabs isn't navigating.
 */
export function FundsRoute() {
  const [params, setParams] = useSearchParams()
  const tab: FundsTab = params.get('tab') === 'allocations' ? 'allocations' : 'wallets'

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
    <div className="mx-auto w-full max-w-xl space-y-4">
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

      <Tabs
        value={tab}
        onValueChange={(value) => setParams({ tab: value as FundsTab }, { replace: true })}
        className="gap-4"
      >
        <TabsList className="h-10! w-full">
          <TabsTrigger value="wallets">
            <Wallet />
            Wallets
          </TabsTrigger>
          <TabsTrigger value="allocations">
            <ChartPie />
            Allocations
          </TabsTrigger>
        </TabsList>
        <TabsContent value="wallets">
          <WalletsTab />
        </TabsContent>
        <TabsContent value="allocations">
          <AllocationsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
