import { useState } from 'react'
import { ChartPie } from 'lucide-react'

import { AddCard } from '@/components/add-card'
import { EmptyState } from '@/components/layouts/empty-state'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { AllocationBanner } from '@/features/allocations'
import { ArchiveFundDrawer, FundDrawer, FundsList, useFunds, type Fund } from '@/features/funds'
import { getApiErrorMessage } from '@/lib/api-client'

/**
 * The Funds page's Allocations tab: what the money is for. (In code and the
 * API these are still "funds"; the UI has called them allocations since
 * 2026-09-11.)
 */
export function AllocationsTab() {
  const [showArchived, setShowArchived] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  // The allocation under edit, and the one being archived, each double as
  // their drawer's open state.
  const [editing, setEditing] = useState<Fund | null>(null)
  const [archiving, setArchiving] = useState<Fund | null>(null)

  const { funds, isLoading, isError, error } = useFunds({ includeArchived: showArchived })

  return (
    <div className="space-y-4">
      {isError && (
        <Alert variant="destructive">
          <AlertDescription>
            {getApiErrorMessage(error, 'Could not load your allocations.')}
          </AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="h-40 animate-pulse rounded-xl bg-muted" aria-hidden="true" />
      ) : (
        <>
          {/* Composed here, not inside the funds feature: the income split
              already depends on funds, and the reverse would be a cycle. */}
          <AllocationBanner from="/funds?tab=allocations" />

          <label className="flex items-center justify-end gap-2 text-sm text-muted-foreground">
            <Checkbox
              checked={showArchived}
              onCheckedChange={(checked) => setShowArchived(checked === true)}
            />
            Show archived
          </label>

          <AddCard
            label="Add new allocation"
            onClick={() => {
              setEditing(null)
              setDrawerOpen(true)
            }}
          />

          {funds.length === 0 ? (
            <EmptyState
              icon={ChartPie}
              title={showArchived ? 'No allocations' : 'No allocations yet'}
              description="Add what your money is for — Savings, Emergency Fund, Travel. Money you add to a wallet waits in Unallocated until you split it."
            />
          ) : (
            <FundsList
              funds={funds}
              onEdit={(fund) => {
                setEditing(fund)
                setDrawerOpen(true)
              }}
              onArchive={setArchiving}
            />
          )}
        </>
      )}

      <FundDrawer
        open={drawerOpen}
        fund={editing}
        onOpenChange={(open) => {
          setDrawerOpen(open)
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
