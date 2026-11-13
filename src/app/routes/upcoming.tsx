import { useState } from 'react'

import { UpcomingDrawer, UpcomingTabs } from '@/features/upcoming'

/**
 * Upcoming expenses, a tab per window. A row opens that due date's own page,
 * which is where it is paid, skipped, edited or deleted — the list stays a
 * list, so adding a bill is all this route has to hold.
 *
 * A phone's column; from lg the page's full width up to the cap, for the
 * list and the month's calendar side by side.
 */
export function UpcomingRoute() {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <div className="mx-auto w-full max-w-xl space-y-4 lg:max-w-310">
      <UpcomingTabs onAdd={() => setDrawerOpen(true)} />

      <UpcomingDrawer open={drawerOpen} expense={null} onOpenChange={setDrawerOpen} />
    </div>
  )
}
