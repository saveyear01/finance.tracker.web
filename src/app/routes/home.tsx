import { useMemo, useState } from 'react'

import { PageIntro } from '@/components/layouts/page-intro'
import { MonthSoFar } from '@/features/analytics'
import { useCurrentUser } from '@/features/auth'
import { fundColors, OverdrawnNotice, useFunds } from '@/features/funds'
import { SetupChecklist, useSetupProgress } from '@/features/onboarding'
import {
  ActionDrawer,
  BalanceCard,
  type BalanceAllocation,
  type LedgerAction,
  type PocketsBurst,
} from '@/features/transactions'
import { DueThisMonth } from '@/features/upcoming'

/**
 * Home, minimal since 2026-11-13 (mockup `design/home-minimal.html` — the
 * user found it overwhelming). Each block answers one question in a line or
 * two and opens the page that has the rest:
 *
 * 1. How much do I have? — the balance card: the total, the 3D wallet and
 *    the quick actions;
 * 2. a notice, only while an allocation is below zero (and the "Get set up"
 *    checklist, only for a household not yet set up);
 * 3. What must I pay? — Due this month: what's left, the overdue count, and
 *    the bills and budgets still owed (no pinning any more — removed
 *    2026-11-13);
 * 4. How's the month? — spent today, in and out; from `lg` also what was
 *    kept and a bar per day of spending. Off until something has been
 *    recorded for a household still setting up.
 *
 * Gone from Home, each still a tap away: the allocation list and "set
 * aside" (Funds → Allocations), "more than your balance" (Upcoming), the
 * month's notes and "You kept" (Analytics), Where it sits (Funds → Wallets).
 * Recent activity stays off (2026-09-24: it has its own page).
 *
 * From `lg`, two columns: money on the left (the balance card, then the
 * month under it), bills on the right at full height.
 *
 * The total is summed in integer cents from the allocations that COUNT
 * (`in_total` — decided 2026-09-24), so money set aside can be left out of
 * what reads as spendable.
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
  // What the card lists and its wallet shows: EVERY allocation, set-aside
  // ones too (the user's call, 2026-11-13) — only the total leaves them out.
  // Each in the colour it wears on Funds.
  const allocations = useMemo<BalanceAllocation[]>(() => {
    const colors = fundColors(funds)
    return funds.map((fund) => ({
      id: fund.id,
      name: fund.name,
      cents: Math.round(Number(fund.balance) * 100),
      color: colors.get(fund.id) ?? 'var(--series-other)',
    }))
  }, [funds])
  // An income just recorded, played on the card as coins split like its legs.
  const [burst, setBurst] = useState<PocketsBurst | null>(null)

  return (
    <div className="mx-auto w-full max-w-xl space-y-4 lg:max-w-310">
      {/* Desktop only: the mobile header already greets by name. */}
      <div className="hidden lg:block">
        <PageIntro>{user ? `${greeting}, ${user.first_name}.` : `${greeting}.`}</PageIntro>
      </div>

      {/* One column on a phone, in reading order. From `lg`, the bills take
          the right-hand column across every row and `order` stacks the rest
          on the left; the last row soaks up the difference so the left-hand
          cards never spread apart. */}
      {/* `grid-cols-1` is `minmax(0, 1fr)`: an implicit `auto` column grows to
          its widest card's content, which pushed every card past the edge of
          a phone under ~370px. */}
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:grid-rows-[auto_auto_auto_auto_1fr] lg:gap-6">
        <div className="min-w-0 lg:order-1 lg:col-start-1">
          <BalanceCard
            total={(cents / 100).toFixed(2)}
            allocations={allocations}
            burst={burst}
            // Until the wallets have loaded, assume there is one: dimming a
            // set-up household's actions for a moment would read as broken.
            hasWallet={!setup.ready || setup.done.wallet}
            onAction={setAction}
          />
        </div>
        <div className="min-w-0 empty:hidden lg:order-2 lg:col-start-1">
          <OverdrawnNotice funds={funds} />
        </div>
        {/* Straight after the balance, so a new household meets it before the
            bills. */}
        {showChecklist && (
          <div className="min-w-0 lg:order-3 lg:col-start-1">
            <SetupChecklist
              progress={setup}
              onRecordIncome={() => setAction('income')}
              onHide={hideChecklist}
            />
          </div>
        )}
        <div className="min-w-0 lg:col-start-2 lg:row-span-5 lg:row-start-1">
          <DueThisMonth />
        </div>
        {!(showChecklist && setup.nothingRecorded) && (
          // From lg, under the balance card (2026-11-13, the user's call),
          // where its spending-per-day chart has the width to read.
          <div className="min-w-0 lg:order-4 lg:col-start-1">
            <MonthSoFar />
          </div>
        )}
      </div>

      <ActionDrawer
        action={action}
        onRecorded={(recorded, entries) => {
          if (recorded !== 'income' || entries.length === 0) return
          setBurst({
            key: entries[0].group_id,
            legs: entries
              .filter((entry) => entry.fund_id !== null)
              .map((entry) => ({
                id: entry.fund_id!,
                cents: Math.round(Number(entry.amount) * 100),
              })),
          })
        }}
        onOpenChange={(open) => {
          if (!open) setAction(null)
        }}
      />
    </div>
  )
}
