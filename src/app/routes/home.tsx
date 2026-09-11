import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

import { PageIntro } from '@/components/layouts/page-intro'
import { useCurrentUser } from '@/features/auth'
import {
  ActionDrawer,
  BalanceCard,
  RecentActivity,
  type LedgerAction,
} from '@/features/transactions'
import { UpcomingSummary } from '@/features/upcoming'
import { useWallets } from '@/features/wallets'

/**
 * Home, after the design reference: the balance card with its quick actions,
 * the upcoming expenses still to pay this month, then Recent Activity.
 *
 * Laid out as a screen, not a document (it is in `SCREEN_PAGES`): the card
 * stays put and only the activity list scrolls, in whatever height is left.
 * The section keeps a 12rem floor, so on a viewport too short for that the
 * shell scrolls the whole page instead of squeezing the list to nothing.
 *
 * The total is summed from the wallets list in integer cents, so it is exact
 * and always the same figure the Wallets page shows.
 */
export function HomeRoute() {
  const { user } = useCurrentUser()
  const { wallets } = useWallets()
  // The action being recorded doubles as the drawer's open state.
  const [action, setAction] = useState<LedgerAction | null>(null)

  const active = wallets.filter((wallet) => wallet.archived_at === null)
  const cents = active.reduce((sum, wallet) => sum + Math.round(Number(wallet.balance) * 100), 0)

  return (
    // `min-h-0` matters: a flex item's default minimum is its content height,
    // which would grow this to the whole list and leave nothing to scroll.
    <div className="mx-auto flex min-h-0 w-full max-w-xl flex-1 flex-col gap-5">
      {/* Desktop only: the mobile header already greets by name. */}
      <div className="hidden shrink-0 lg:block">
        <PageIntro>{user ? `Welcome back, ${user.first_name}.` : 'Welcome back.'}</PageIntro>
      </div>

      <div className="shrink-0">
        <BalanceCard
          total={(cents / 100).toFixed(2)}
          walletCount={active.length}
          onAction={setAction}
        />
      </div>

      {/* The way in to Upcoming — it has no icon in the mobile pill. */}
      <div className="shrink-0">
        <UpcomingSummary />
      </div>

      <section className="flex min-h-48 flex-1 flex-col gap-3">
        <div className="flex shrink-0 items-center justify-between">
          <h2 className="font-semibold">Recent activity</h2>
          <Link
            to="/transactions"
            className="flex items-center gap-0.5 text-sm font-medium text-primary hover:underline"
          >
            See all
            <ChevronRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
        {/* The only part of Home that scrolls. `overscroll-contain` stops a
            flick at the list's end from scrolling anything behind it. The
            latest 10; the Transactions page has the rest. */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <RecentActivity limit={10} />
        </div>
      </section>

      <ActionDrawer
        action={action}
        onOpenChange={(open) => {
          if (!open) setAction(null)
        }}
      />
    </div>
  )
}
