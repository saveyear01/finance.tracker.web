import { useState } from 'react'
import { ChevronRight, Wallet as WalletIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

import { AddCard } from '@/components/add-card'
import { EmptyState } from '@/components/layouts/empty-state'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { WalletDrawer, WalletRows, useWallets, walletGroups } from '@/features/wallets'
import { useIsCompact } from '@/hooks/use-compact'
import { getApiErrorMessage } from '@/lib/api-client'

const FROM = '/wallets'

/**
 * The Wallets list: where the money physically sits, each wallet a row
 * showing what it holds by allocation and opening its own page — where it is
 * edited and archived. A page of its own since 2026-11-13 (it was a tab of
 * Funds, beside Allocations). On a phone it is the /wallets page; on a big
 * screen it is also the left pane beside an open wallet (`selectedId`).
 *
 * The sum is the list's last row, quiet — not a headline (the user's call).
 * On a phone a link opens Allocations, which the pill's Wallets item also
 * stands for; a big screen has it in the sidebar.
 *
 * Archived wallets are one link under the list, offered only when there are
 * any. When the open one is archived the archived rows show, so the open
 * row is never hidden.
 */
export function WalletsList({ selectedId }: { selectedId?: string }) {
  const compact = useIsCompact()
  const [expanded, setExpanded] = useState(false)
  const [adding, setAdding] = useState(false)
  // Every wallet, archived too — one fetch, so the link below knows its count.
  const { wallets, isLoading, isError, error } = useWallets({ includeArchived: true })
  const { active, archived } = walletGroups(wallets)
  const showArchived = expanded || archived.some((wallet) => wallet.id === selectedId)
  const total = active.reduce((sum, wallet) => sum + Math.round(Number(wallet.balance) * 100), 0)

  return (
    <div className="space-y-3">
      {compact && (
        <div className="flex justify-end">
          <Link
            to="/allocations"
            className="inline-flex items-center gap-0.5 rounded-md text-sm font-medium text-primary outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            Allocations
            <ChevronRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      )}

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
        <WalletRows wallets={active} from={FROM} selectedId={selectedId} total={total} />
      )}

      {archived.length > 0 &&
        (showArchived ? (
          <section className="space-y-2 pt-2">
            <h2 className="px-0.5 text-sm font-semibold text-muted-foreground">Archived · {archived.length}</h2>
            <WalletRows wallets={archived} from={FROM} selectedId={selectedId} />
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
