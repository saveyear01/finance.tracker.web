import { useState } from 'react'

import { PageIntro } from '@/components/layouts/page-intro'
import { MonthSoFar } from '@/features/analytics'
import { useCurrentUser } from '@/features/auth'
import { OverdrawnNotice, useFunds } from '@/features/funds'
import { SetupChecklist, useSetupProgress } from '@/features/onboarding'
import { ActionDrawer, BalanceCard, type LedgerAction } from '@/features/transactions'
import { DueThisMonth } from '@/features/upcoming'
import { WhereItSits } from '@/features/wallets'

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
 * 4. from `lg`, "Where it sits" — each wallet's balance and what it holds
 *    by allocation (design/large-screen.html, 2026-11-13). Left off a phone,
 *    whose Home was already full and where Funds is one tap away;
 * 5. the month so far — in, out and kept — the way in to Analytics. For a
 *    household not yet set up, the "Get set up" checklist comes first in
 *    this slot (every screen size), and the month so far stays off until
 *    something has been recorded.
 *
 * Recent activity stays off (2026-09-24: it has its own page). An ordinary
 * page that scrolls as a whole — no longer a fixed screen with an inner
 * scrolling list, which hid under the nav pill on a small phone. From `lg`,
 * a 2 : 1 grid: money on the left, bills on the right at full height.
 *
 * The total is summed in integer cents from the allocations that COUNT
 * (`in_total`, toggled from each allocation's menu — decided 2026-09-24), so
 * money set aside can be left out of what reads as spendable. With every
 * allocation counted it is exactly the Wallets page's figure, since both
 * views sum the same balance rows.
 */
/**
 * Whether the setup checklist was hidden on this device. A household may
 * choose never to set an income split (income then stays in Unallocated), so
 * the card must be dismissible rather than nag until all four steps are done.
 * Per device, not on the account: it's a convenience, not a preference.
 */
const CHECKLIST_HIDDEN_KEY = 'setup-checklist-hidden'
function readChecklistHidden(): boolean {
  try {
    return localStorage.getItem(CHECKLIST_HIDDEN_KEY) === '1'
  } catch {
    return false
  }
}

export function HomeRoute() {
  const { user } = useCurrentUser()
  const { funds } = useFunds()
  const setup = useSetupProgress()
  const [checklistHidden, setChecklistHidden] = useState(readChecklistHidden)
  const hideChecklist = () => {
    setChecklistHidden(true)
    try {
      localStorage.setItem(CHECKLIST_HIDDEN_KEY, '1')
    } catch {
      // Private mode or blocked storage: hidden for this visit only.
    }
  }
  const showChecklist = setup.ready && !setup.complete && !checklistHidden
  // "Welcome", not "welcome back", to a household that has only just started.
  const greeting = showChecklist && setup.doneCount === 0 ? 'Welcome' : 'Welcome back'
  // The action being recorded doubles as the drawer's open state.
  const [action, setAction] = useState<LedgerAction | null>(null)

  const centsOf = (amount: string) => Math.round(Number(amount) * 100)
  const counted = funds.filter((fund) => fund.in_total)
  const cents = counted.reduce((sum, fund) => sum + centsOf(fund.balance), 0)
  const setAsideCents = funds
    .filter((fund) => !fund.in_total)
    .reduce((sum, fund) => sum + centsOf(fund.balance), 0)

  return (
    <div className="mx-auto w-full max-w-xl space-y-4 lg:max-w-310">
      {/* Desktop only: the mobile header already greets by name. */}
      <div className="hidden lg:block">
        <PageIntro>{user ? `${greeting}, ${user.first_name}.` : `${greeting}.`}</PageIntro>
      </div>

      {/* One column on a phone, in reading order. From `lg`, the bills take
          the right-hand column across every row; the last row soaks up the
          difference so the left-hand cards never spread apart. */}
      {/* `grid-cols-1` is `minmax(0, 1fr)`: an implicit `auto` column grows to
          its widest card's content, which pushed every card past the edge of
          a phone under ~370px. */}
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:grid-rows-[auto_auto_auto_auto_1fr] lg:gap-6">
        <div className="min-w-0 lg:col-start-1">
          <BalanceCard
            total={(cents / 100).toFixed(2)}
            counted={counted.length}
            allocationCount={funds.length}
            setAsideCents={setAsideCents}
            // Until the wallets have loaded, assume there is one: dimming a
            // set-up household's actions for a moment would read as broken.
            hasWallet={!setup.ready || setup.done.wallet}
            onAction={setAction}
          />
        </div>
        <div className="min-w-0 empty:hidden lg:col-start-1">
          <OverdrawnNotice funds={funds} />
        </div>
        {/* Straight after the balance on a phone, so a new household meets it
            before the bills; from lg, `order` puts it under Where it sits. */}
        {showChecklist && (
          <div className="min-w-0 lg:order-4 lg:col-start-1">
            <SetupChecklist
              progress={setup}
              onRecordIncome={() => setAction('income')}
              onHide={hideChecklist}
            />
          </div>
        )}
        <div className="min-w-0 lg:col-start-2 lg:row-span-5 lg:row-start-1">
          <DueThisMonth balanceCents={cents} setAsideCents={setAsideCents} />
        </div>
        {/* Hidden while empty (no wallets), or its grid row would still take a gap. */}
        <div className="hidden min-w-0 lg:order-3 lg:col-start-1 lg:block lg:empty:hidden">
          <WhereItSits />
        </div>
        {!(showChecklist && setup.nothingRecorded) && (
          <div className="min-w-0 lg:order-5 lg:col-start-1">
            <MonthSoFar />
          </div>
        )}
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
