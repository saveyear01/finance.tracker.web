import { useState } from 'react'
import { Wallet as WalletIcon } from 'lucide-react'

import { AddCard } from '@/components/add-card'
import { EmptyState } from '@/components/layouts/empty-state'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { WalletDrawer, WalletRows, useWallets, walletGroups } from '@/features/wallets'
import { getApiErrorMessage } from '@/lib/api-client'

/**
 * The Funds page's Wallets tab: where the money physically sits, each wallet
 * a row showing what it holds by allocation and opening its own page — where
 * it is edited and archived (2026-11-11; rows carry no menu). The total is
 * the page's, above the tabs.
 *
 * Archived wallets are one link under the list, offered only when there are
 * any, rather than a checkbox floating over it.
 *
 * `selectedId` is the wallet open beside the list on a big screen. When that
 * one is archived the archived rows show, so the open row is never hidden.
 */
export function WalletsTab({ selectedId }: { selectedId?: string }) {
  const [expanded, setExpanded] = useState(false)
  const [adding, setAdding] = useState(false)
  // Every wallet, archived too — one fetch, so the link below knows its count.
  const { wallets, isLoading, isError, error } = useWallets({ includeArchived: true })
  const { active, archived } = walletGroups(wallets)
  const showArchived = expanded || archived.some((wallet) => wallet.id === selectedId)

  return (
    <div className="space-y-3">
      {isError && (
        <Alert variant="destructive">
          <AlertDescription>{getApiErrorMessage(error, 'Could not load your wallets.')}</AlertDescription>
        </Alert>
      )}

      <AddCard label="Add new wallet" onClick={() => setAdding(true)} />

      {isLoading ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : active.length === 0 ? (
        <EmptyState
          icon={WalletIcon}
          title="No wallets yet"
          description="Add your bank accounts, e-wallets and cash, with what's in each right now."
        />
      ) : (
        <WalletRows wallets={active} from="/funds?tab=wallets" selectedId={selectedId} />
      )}

      {archived.length > 0 &&
        (showArchived ? (
          <section className="space-y-2 pt-2">
            <h2 className="px-0.5 text-sm font-semibold text-muted-foreground">Archived · {archived.length}</h2>
            <WalletRows wallets={archived} from="/funds?tab=wallets" selectedId={selectedId} />
          </section>
        ) : (
          <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => setExpanded(true)}>
            Show {archived.length} archived
          </Button>
        ))}

      <WalletDrawer open={adding} wallet={null} onOpenChange={setAdding} />
    </div>
  )
}
