import { useState } from 'react'
import { ChartPie, Plus, Wallet } from 'lucide-react'
import { Navigate, useSearchParams } from 'react-router-dom'

import { EmptyState } from '@/components/layouts/empty-state'
import { SplitView } from '@/components/layouts/split-view'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs } from '@/components/ui/tabs'
import { FundDrawer } from '@/features/funds'
import { WalletDrawer } from '@/features/wallets'
import { useIsCompact } from '@/hooks/use-compact'

import { tabPath, useFirstRows, useSwitchTab, type FundsTab } from './funds-first-row'
import { FundsList, FundsTabsList } from './funds-list'

/**
 * Funds: where the money sits (Wallets) and what it's for (Allocations), as
 * two tabs of one page (`FundsList`). A row opens that wallet's or
 * allocation's own page (`/funds/wallets/:id`, `/funds/allocations/:id`).
 *
 * The tab lives in the URL (`?tab=allocations`), so a link can open either
 * one and Back returns to it; Wallets when there's none. Switching replaces
 * the history entry rather than adding one — flipping tabs isn't navigating.
 *
 * On a big screen (from `lg`) the list sits beside the open item, so this
 * page has nothing of its own to show: it opens the tab's first row, whose
 * route draws the list beside it (design/large-screen.html, "Funds"). Only
 * an empty tab stays here, as one centred empty state (rule B) rather than
 * an empty list beside an empty pane.
 */
export function FundsRoute() {
  const [params, setParams] = useSearchParams()
  const tab: FundsTab = params.get('tab') === 'allocations' ? 'allocations' : 'wallets'
  const compact = useIsCompact()
  const { isLoading, isError, first } = useFirstRows()
  const switchTab = useSwitchTab()

  if (compact || isError) {
    // A failed load shows the list with its own error, at any width.
    return (
      <div className="mx-auto w-full max-w-xl">
        <FundsList tab={tab} onTabChange={(next) => setParams({ tab: next }, { replace: true })} />
      </div>
    )
  }

  if (isLoading) {
    return (
      <SplitView
        list={<Skeleton className="h-96 w-full rounded-xl" />}
        detail={<Skeleton className="h-64 w-full rounded-xl" />}
      />
    )
  }

  const path = first[tab]
  if (path) return <Navigate to={path} replace state={{ from: tabPath(tab) }} />

  return <FundsEmpty tab={tab} onTabChange={switchTab} />
}

/**
 * A big screen's Funds with nothing on this tab: no panes, one centred
 * empty state with the button that adds the first one (rule B). The tabs
 * stay above it — the other tab may well have rows (rule C).
 */
function FundsEmpty({ tab, onTabChange }: { tab: FundsTab; onTabChange: (tab: FundsTab) => void }) {
  const [adding, setAdding] = useState(false)

  return (
    <div className="mx-auto flex w-full max-w-310 flex-col items-center gap-6 pt-2">
      <Tabs value={tab} onValueChange={(value) => onTabChange(value as FundsTab)}>
        <FundsTabsList className="w-80" />
      </Tabs>

      <div className="w-full max-w-140">
        {tab === 'wallets' ? (
          <EmptyState
            icon={Wallet}
            title="No wallets yet"
            description="Add your bank accounts, e-wallets and cash, with what's in each right now."
            action={
              <Button onClick={() => setAdding(true)}>
                <Plus />
                Add new wallet
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={ChartPie}
            title="No allocations yet"
            description="Add what your money is for — Savings, Emergency Fund, Travel. Money you add to a wallet waits in Unallocated until you split it."
            action={
              <Button onClick={() => setAdding(true)}>
                <Plus />
                Add new allocation
              </Button>
            }
          />
        )}
      </div>

      {/* Once the first one exists, the page opens it (the redirect above). */}
      <WalletDrawer open={adding && tab === 'wallets'} wallet={null} onOpenChange={setAdding} />
      <FundDrawer open={adding && tab === 'allocations'} fund={null} onOpenChange={setAdding} />
    </div>
  )
}
