import { useState } from 'react'
import { Landmark, Plus } from 'lucide-react'
import { Navigate } from 'react-router-dom'

import { EmptyState } from '@/components/layouts/empty-state'
import { SplitView } from '@/components/layouts/split-view'
import { Button } from '@/components/ui/button'
import { DebtDrawer, DebtList, useDebts } from '@/features/debts'
import { useIsCompact } from '@/hooks/use-compact'

/**
 * Debts: what you owe, at a glance. A row opens that debt's own page, which
 * is where it is paid, added to, edited or deleted — the list stays a list.
 *
 * From `lg` the list and a debt sit side by side, and that view lives at
 * `/debts/:debtId` — so `/debts` itself opens the first debt (the top of the
 * priority, else the first paid off), replacing the entry so Back doesn't
 * bounce straight back here. With no debts at all there's nothing to put in
 * either pane, so one empty state takes the page instead (large-screen.html,
 * rule B), its button the way to the first debt. A phone keeps the list.
 */
export function DebtsRoute() {
  const compact = useIsCompact()
  const { debts, isLoading, isError } = useDebts()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const drawer = <DebtDrawer open={drawerOpen} debt={null} onOpenChange={setDrawerOpen} />

  if (compact) {
    return (
      <div className="mx-auto w-full max-w-xl space-y-4">
        <DebtList onAdd={() => setDrawerOpen(true)} />
        {drawer}
      </div>
    )
  }

  // The list's open debts come first, in priority order, so the first row is
  // the first open debt, or the first paid-off one when none is open.
  const first = debts.find((debt) => debt.status === 'open') ?? debts[0]
  if (first) return <Navigate to={`/debts/${first.id}`} replace />

  if (!isLoading && !isError) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <div className="w-full max-w-140">
          <EmptyState
            icon={Landmark}
            title="Nothing owed"
            description="Track a loan or a card balance to watch it come down."
            action={
              <Button onClick={() => setDrawerOpen(true)}>
                <Plus />
                Add new debt
              </Button>
            }
          />
        </div>
        {drawer}
      </div>
    )
  }

  // Still loading, or failed: the list pane shows its skeleton or the error.
  return (
    <>
      <SplitView list={<DebtList onAdd={() => setDrawerOpen(true)} />} />
      {drawer}
    </>
  )
}
