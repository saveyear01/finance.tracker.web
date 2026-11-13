import { useState } from 'react'
import { Plus, Wallet } from 'lucide-react'
import { Navigate } from 'react-router-dom'

import { EmptyState } from '@/components/layouts/empty-state'
import { SplitView } from '@/components/layouts/split-view'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { WalletDrawer, useWallets, walletGroups } from '@/features/wallets'
import { useIsCompact } from '@/hooks/use-compact'

import { WalletsList } from './wallets-list'

/**
 * Wallets — where the money sits — a page of its own since 2026-11-13 (it
 * was the Wallets tab of Funds). A row opens the wallet's own page
 * (`/wallets/:id`).
 *
 * On a big screen (from `lg`) the list sits beside the open wallet, so this
 * page has nothing of its own to show: it opens the first wallet — an
 * active one, else an archived one, which the list then shows — whose route
 * draws the list beside it. With no wallets at all it stays here, as one
 * centred empty state rather than an empty list beside an empty pane.
 */
export function WalletsRoute() {
  const compact = useIsCompact()
  const { wallets, isLoading, isError } = useWallets({ includeArchived: true })
  const [adding, setAdding] = useState(false)

  if (compact || isError) {
    // A failed load shows the list with its own error, at any width.
    return (
      <div className="mx-auto w-full max-w-xl">
        <WalletsList />
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

  const { active, archived } = walletGroups(wallets)
  const first = active[0] ?? archived[0]
  if (first) return <Navigate to={`/wallets/${first.id}`} replace state={{ from: '/wallets' }} />

  return (
    <div className="mx-auto w-full max-w-140 pt-2">
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
      {/* Once the first one exists, the page opens it (the redirect above). */}
      <WalletDrawer open={adding} wallet={null} onOpenChange={setAdding} />
    </div>
  )
}
