import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

import { PageIntro } from '@/components/layouts/page-intro'
import { useCurrentUser } from '@/features/auth'
import { ActionDrawer, BalanceCard, type LedgerAction } from '@/features/transactions'
import { useFunds } from '@/features/funds'
import { PinnedExpenses, UpcomingSummary } from '@/features/upcoming'

/**
 * Home, after the design reference: the balance card with its quick actions,
 * the upcoming expenses still to pay this month, then the pinned expenses —
 * the bills pinned for quick access, each as the due date to pay next. (It
 * replaced Recent activity on 2026-09-24: the activity has its own page, and
 * what Home is for is getting to the next thing to pay.)
 *
 * Laid out as a screen, not a document (it is in `SCREEN_PAGES`): the card
 * stays put and only the pinned list scrolls, in whatever height is left.
 * The section keeps a 12rem floor, so on a viewport too short for that the
 * shell scrolls the whole page instead of squeezing the list to nothing.
 *
 * The total is summed in integer cents from the allocations that COUNT
 * (`in_total`, toggled from each allocation's menu — decided 2026-09-24), so
 * money set aside can be left out of what reads as spendable. With every
 * allocation counted it is exactly the Wallets page's figure, since both
 * views sum the same balance rows.
 */
export function HomeRoute() {
  const { user } = useCurrentUser()
  const { funds } = useFunds()
  // The action being recorded doubles as the drawer's open state.
  const [action, setAction] = useState<LedgerAction | null>(null)

  const counted = funds.filter((fund) => fund.in_total)
  const cents = counted.reduce((sum, fund) => sum + Math.round(Number(fund.balance) * 100), 0)

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
          counted={counted.length}
          allocationCount={funds.length}
          onAction={setAction}
        />
      </div>

      {/* The way in to Upcoming — it has no icon in the mobile pill. */}
      <div className="shrink-0">
        <UpcomingSummary />
      </div>

      <section className="flex min-h-48 flex-1 flex-col gap-3">
        <div className="flex shrink-0 items-center justify-between">
          <h2 className="font-semibold">Pinned expenses</h2>
          <Link
            to="/upcoming"
            className="flex items-center gap-0.5 text-sm font-medium text-primary hover:underline"
          >
            See all
            <ChevronRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
        {/* The only part of Home that scrolls. `overscroll-contain` stops a
            flick at the list's end from scrolling anything behind it. */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <PinnedExpenses />
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
