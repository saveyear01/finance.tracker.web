import { useState } from 'react'
import { useParams } from 'react-router-dom'

import { ArchiveFundDrawer, FundDetail, FundDrawer, type Fund } from '@/features/funds'
import { TransactionFeed } from '@/features/transactions'

/**
 * One allocation's page: its balance, where it sits, whether Home counts it,
 * and its own entries. Composed here because the activity comes from
 * transactions, which already depends on funds.
 */
export function FundsAllocationDetailRoute() {
  const { fundId } = useParams()
  // Each doubles as its drawer's open state.
  const [editing, setEditing] = useState<Fund | null>(null)
  const [archiving, setArchiving] = useState<Fund | null>(null)

  return (
    <div className="mx-auto w-full max-w-xl">
      <FundDetail
        id={fundId}
        onEdit={setEditing}
        onArchive={setArchiving}
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
    </div>
  )
}
