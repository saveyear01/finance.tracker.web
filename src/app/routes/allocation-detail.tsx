import { useState } from 'react'
import { useParams } from 'react-router-dom'

import { SplitView } from '@/components/layouts/split-view'
import { ArchiveFundDrawer, FundDetail, FundDrawer, type Fund } from '@/features/funds'
import { WalletAvatar } from '@/features/wallets'
import { TransactionFeed } from '@/features/transactions'

import { AllocationsList } from './allocations-list'

/**
 * One allocation's page: its balance, where it sits, whether Home counts it,
 * and its own entries. Composed here because the activity comes from
 * transactions, which already depends on funds.
 *
 * On a big screen it opens beside the Allocations list (this row marked);
 * on a phone it is a page of its own. Same URL either way.
 */
export function AllocationDetailRoute() {
  const { fundId } = useParams()
  // Each doubles as its drawer's open state.
  const [editing, setEditing] = useState<Fund | null>(null)
  const [archiving, setArchiving] = useState<Fund | null>(null)

  return (
    <>
      <SplitView
        list={<AllocationsList selectedId={fundId} />}
        detail={
          <FundDetail
            id={fundId}
            onEdit={setEditing}
            onArchive={setArchiving}
            walletIcon={(walletId) => <WalletAvatar walletId={walletId} size="xs" />}
            activity={
              <TransactionFeed
                filter={{ fundId }}
                empty={{
                  title: 'Nothing here yet',
                  description: 'Income, expenses and moves into or out of this allocation show up here.',
                }}
              />
            }
          />
        }
      />

      <FundDrawer
        open={editing !== null}
        fund={editing}
        onOpenChange={(open) => {
          if (!open) setEditing(null)
        }}
      />
      <ArchiveFundDrawer
        fund={archiving}
        onOpenChange={(open) => {
          if (!open) setArchiving(null)
        }}
      />
    </>
  )
}
