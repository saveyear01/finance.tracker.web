import { useState } from 'react'

import {
  DeleteUpcomingDrawer,
  PayDrawer,
  UpcomingDrawer,
  UpcomingTabs,
  type Occurrence,
  type UpcomingExpense,
} from '@/features/upcoming'

export function UpcomingRoute() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  // Each doubles as its drawer's open state.
  const [editing, setEditing] = useState<UpcomingExpense | null>(null)
  const [paying, setPaying] = useState<Occurrence | null>(null)
  const [deleting, setDeleting] = useState<UpcomingExpense | null>(null)

  return (
    <div className="mx-auto w-full max-w-xl space-y-4">
      <UpcomingTabs
        onAdd={() => {
          setEditing(null)
          setDrawerOpen(true)
        }}
        onPay={setPaying}
        onEdit={(expense) => {
          setEditing(expense)
          setDrawerOpen(true)
        }}
        onDelete={setDeleting}
      />

      <UpcomingDrawer
        open={drawerOpen}
        expense={editing}
        onOpenChange={(open) => {
          setDrawerOpen(open)
          if (!open) setEditing(null)
        }}
      />
      <PayDrawer
        occurrence={paying}
        onOpenChange={(open) => {
          if (!open) setPaying(null)
        }}
      />
      <DeleteUpcomingDrawer
        expense={deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null)
        }}
      />
    </div>
  )
}
