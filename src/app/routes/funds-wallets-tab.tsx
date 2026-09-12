import { useState } from 'react'
import { Wallet as WalletIcon } from 'lucide-react'

import { AddCard } from '@/components/add-card'
import { EmptyState } from '@/components/layouts/empty-state'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import {
  ArchiveWalletDrawer,
  WalletDrawer,
  WalletsList,
  useWallets,
  type Wallet,
} from '@/features/wallets'
import { getApiErrorMessage } from '@/lib/api-client'

/** The Funds page's Wallets tab: where the money physically sits. The total
 * is the page's, above the tabs. */
export function WalletsTab() {
  const [showArchived, setShowArchived] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  // The wallet under edit, and the one being archived, each double as their
  // drawer's open state — neither has a meaningful state without a row.
  const [editing, setEditing] = useState<Wallet | null>(null)
  const [archiving, setArchiving] = useState<Wallet | null>(null)

  const { wallets, isLoading, isError, error } = useWallets({
    includeArchived: showArchived,
  })

  return (
    <div className="space-y-4">
      {isError && (
        <Alert variant="destructive">
          <AlertDescription>
            {getApiErrorMessage(error, 'Could not load your wallets.')}
          </AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="h-40 animate-pulse rounded-xl bg-muted" aria-hidden="true" />
      ) : (
        <>
          <label className="flex items-center justify-end gap-2 text-sm text-muted-foreground">
            <Checkbox
              checked={showArchived}
              onCheckedChange={(checked) => setShowArchived(checked === true)}
            />
            Show archived
          </label>

          <AddCard
            label="Add new wallet"
            onClick={() => {
              setEditing(null)
              setDrawerOpen(true)
            }}
          />

          {wallets.length === 0 ? (
            <EmptyState
              icon={WalletIcon}
              title={showArchived ? 'No wallets' : 'No wallets yet'}
              description="Add your bank accounts, e-wallets and cash, with what's in each right now."
            />
          ) : (
            <WalletsList
              wallets={wallets}
              onEdit={(wallet) => {
                setEditing(wallet)
                setDrawerOpen(true)
              }}
              onArchive={setArchiving}
            />
          )}
        </>
      )}

      <WalletDrawer
        open={drawerOpen}
        wallet={editing}
        onOpenChange={(open) => {
          setDrawerOpen(open)
          if (!open) setEditing(null)
        }}
      />
      <ArchiveWalletDrawer
        wallet={archiving}
        onOpenChange={(open) => {
          if (!open) setArchiving(null)
        }}
      />
    </div>
  )
}
