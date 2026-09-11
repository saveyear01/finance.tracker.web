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
 * integer cents — the same number Home shows.
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
  const cents = wallets.reduce((sum, wallet) => sum + Math.round(Number(wallet.balance) * 100), 0)

  return (
    <>
      <div>
        <p className="text-sm text-muted-foreground">
          Total across {plural(wallets.length, 'wallet', 'wallets')} ·{' '}
          {plural(funds.length, 'allocation', 'allocations')}
        </p>
        <p className="text-3xl font-semibold tabular-nums">
          {isLoading ? '…' : formatMoney(cents / 100)}
        </p>
      </div>

      <Tabs
        value={tab}
        onValueChange={(value) => setParams({ tab: value as FundsTab }, { replace: true })}
        className="gap-4"
      >
        <TabsList className="h-10! w-full sm:w-fit">
          <TabsTrigger value="wallets" className="sm:px-4">
            <Wallet />
            Wallets
          </TabsTrigger>
          <TabsTrigger value="allocations" className="sm:px-4">
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
    </>
  )
}
