import { useState } from 'react'
import { useParams } from 'react-router-dom'

import { SplitView } from '@/components/layouts/split-view'
import { ActionDrawer, QuickActions, TransactionFeed, type LedgerAction } from '@/features/transactions'
import { ArchiveWalletDrawer, WalletDetail, WalletDrawer, type Wallet } from '@/features/wallets'

import { useSwitchTab } from './funds-first-row'
import { FundsList } from './funds-list'

/**
 * One wallet's page: its balance and quick actions — each opening with this
 * wallet picked — what it holds, and its own entries.
 *
 * Composed here because the pieces come from three features: the page from
 * wallets, and recording and the activity from transactions, which already
 * depends on wallets.
 *
 * On a big screen it opens beside the Funds list (Wallets tab, this row
 * marked); on a phone it is a page of its own. Same URL either way.
 */
export function FundsWalletDetailRoute() {
  const { walletId } = useParams()
  const [action, setAction] = useState<LedgerAction | null>(null)
  // Each doubles as its drawer's open state.
  const [editing, setEditing] = useState<Wallet | null>(null)
  const [archiving, setArchiving] = useState<Wallet | null>(null)
  const switchTab = useSwitchTab()

  return (
    <>
      <SplitView
        list={<FundsList tab="wallets" selectedId={walletId} onTabChange={switchTab} />}
        detail={
          <WalletDetail
            id={walletId}
            onEdit={setEditing}
            onArchive={setArchiving}
            actions={<QuickActions onAction={setAction} />}
            activity={
              <TransactionFeed
                filter={{ walletId }}
                empty={{
                  title: 'Nothing here yet',
                  description: 'Income, expenses and transfers in this wallet show up here.',
                }}
              />
            }
          />
        }
      />

      <ActionDrawer
        action={action}
        preset={walletId ? { walletId } : null}
        onOpenChange={(open) => {
          if (!open) setAction(null)
        }}
      />
      <WalletDrawer
        open={editing !== null}
        wallet={editing}
        onOpenChange={(open) => {
          if (!open) setEditing(null)
        }}
      />
      <ArchiveWalletDrawer
        wallet={archiving}
        onOpenChange={(open) => {
          if (!open) setArchiving(null)
        }}
      />
    </>
  )
}
