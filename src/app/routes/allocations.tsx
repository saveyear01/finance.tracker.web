import { useState } from 'react'
import { ChartPie, Plus } from 'lucide-react'
import { Navigate } from 'react-router-dom'

import { EmptyState } from '@/components/layouts/empty-state'
import { SplitView } from '@/components/layouts/split-view'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { allocationGroups, FundDrawer, useFunds } from '@/features/funds'
import { useIsCompact } from '@/hooks/use-compact'

import { AllocationsList } from './allocations-list'

/**
 * Allocations — what the money is for — a page of its own since 2026-11-13
 * (it was the Allocations tab of Funds). A row opens the allocation's own
 * page (`/allocations/:id`).
 *
 * On a big screen (from `lg`) the list sits beside the open allocation, so
 * this page opens the first one as the list orders it — counted on Home,
 * then set aside, then archived — whose route draws the list beside it.
 * With none at all it stays here, as one centred empty state.
 */
export function AllocationsRoute() {
  const compact = useIsCompact()
  const { funds, isLoading, isError } = useFunds({ includeArchived: true })
  const [adding, setAdding] = useState(false)

  if (compact || isError) {
    return (
      <div className="mx-auto w-full max-w-xl">
        <AllocationsList />
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

  const { counted, aside, archived } = allocationGroups(funds)
  const first = counted[0] ?? aside[0] ?? archived[0]
  if (first) return <Navigate to={`/allocations/${first.id}`} replace state={{ from: '/allocations' }} />

  return (
    <div className="mx-auto w-full max-w-140 pt-2">
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
      <FundDrawer open={adding} fund={null} onOpenChange={setAdding} />
    </div>
  )
}
