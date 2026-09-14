import { useState } from 'react'

import { UpcomingDrawer, UpcomingTabs } from '@/features/upcoming'

/**
 * Upcoming expenses, a tab per window. A row opens that due date's own page,
 * which is where it is paid, skipped, edited or deleted — the list stays a
 * list, so adding a bill is all this route has to hold.
 */
export function UpcomingRoute() {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <div className="mx-auto w-full max-w-xl space-y-4">
      <UpcomingTabs onAdd={() => setDrawerOpen(true)} />

      <UpcomingDrawer open={drawerOpen} expense={null} onOpenChange={setDrawerOpen} />
    </div>
  )
}
