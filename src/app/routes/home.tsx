import { useState } from 'react'

import { PageIntro } from '@/components/layouts/page-intro'
import { MonthSoFar } from '@/features/analytics'
import { useCurrentUser } from '@/features/auth'
import { OverdrawnNotice, useFunds } from '@/features/funds'
import { ActionDrawer, BalanceCard, type LedgerAction } from '@/features/transactions'
import { DueThisMonth } from '@/features/upcoming'

/**
 * Home (redesigned 2026-11-11 from an audit, mockup in
 * `design/home-redesign.html`), what's needed to get to the next thing to
 * pay:
 *
 * 1. the balance card and its quick actions, with what the allocations left
 *    out of the total hold;
 * 2. a notice, only while an allocation is below zero;
 * 3. Due this month — what's left to pay, overdue split out, set against the
 *    balance, and the pinned bills (the Upcoming row and the Pinned list,
 *    merged);
 * 4. the month so far — in, out and kept — the way in to Analytics.
 *
 * Recent activity stays off (2026-09-24: it has its own page). An ordinary
 * page that scrolls as a whole — no longer a fixed screen with an inner
 * scrolling list, which hid under the nav pill on a small phone. From `lg`,
 * two columns: money on the left, bills on the right.
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

  const centsOf = (amount: string) => Math.round(Number(amount) * 100)
  const counted = funds.filter((fund) => fund.in_total)
  const cents = counted.reduce((sum, fund) => sum + centsOf(fund.balance), 0)
  const setAsideCents = funds
    .filter((fund) => !fund.in_total)
    .reduce((sum, fund) => sum + centsOf(fund.balance), 0)

  return (
    <div className="mx-auto w-full max-w-xl space-y-4 lg:max-w-5xl">
      {/* Desktop only: the mobile header already greets by name. */}
      <div className="hidden lg:block">
        <PageIntro>{user ? `Welcome back, ${user.first_name}.` : 'Welcome back.'}</PageIntro>
      </div>

      {/* One column on a phone, in reading order. From `lg`, the bills take
          the right-hand column across every row; the last row soaks up the
          difference so the left-hand cards never spread apart. */}
      <div className="grid items-start gap-4 lg:grid-cols-2 lg:grid-rows-[auto_auto_1fr] lg:gap-6">
        <div className="lg:col-start-1">
          <BalanceCard
            total={(cents / 100).toFixed(2)}
            counted={counted.length}
            allocationCount={funds.length}
            setAsideCents={setAsideCents}
            onAction={setAction}
          />
        </div>
        <div className="empty:hidden lg:col-start-1">
          <OverdrawnNotice funds={funds} />
        </div>
        <div className="lg:col-start-2 lg:row-span-3 lg:row-start-1">
          <DueThisMonth balanceCents={cents} setAsideCents={setAsideCents} />
        </div>
        <div className="lg:col-start-1">
          <MonthSoFar />
        </div>
      </div>

      <ActionDrawer
        action={action}
        onOpenChange={(open) => {
          if (!open) setAction(null)
        }}
      />
    </div>
  )
}
