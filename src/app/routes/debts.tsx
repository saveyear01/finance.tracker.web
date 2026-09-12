import { useState } from 'react'

import { PageIntro } from '@/components/layouts/page-intro'
import { DebtDrawer, DebtList } from '@/features/debts'

/**
 * Debts: what you owe, at a glance. A row opens that debt's own page, which
 * is where it is paid, added to, edited or deleted — the list stays a list.
 */
export function DebtsRoute() {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <div className="mx-auto w-full max-w-xl space-y-4">
      {/* Desktop only: the mobile header already names the page. */}
      <div className="hidden lg:block">
        <PageIntro>What you owe, and how far through you are.</PageIntro>
      </div>

      <DebtList onAdd={() => setDrawerOpen(true)} />

      <DebtDrawer open={drawerOpen} debt={null} onOpenChange={setDrawerOpen} />
    </div>
  )
}
