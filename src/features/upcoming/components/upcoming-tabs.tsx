import { CalendarCheck, Plus } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'

import { EmptyState } from '@/components/layouts/empty-state'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { localToday } from '@/features/transactions'
import { useIsCompact } from '@/hooks/use-compact'

import { useDue, useUpcomingList } from '../hooks/use-upcoming'
import { currentAndNextMonth, laterWindow, monthName, summarize } from '../lib/upcoming-meta'
import { MonthBills } from './month-bills'

const TABS = ['current', 'next', 'later'] as const
type UpcomingTab = (typeof TABS)[number]

/**
 * The upcoming expenses in three tabs: this month (with anything overdue
 * carried in, and counted in red on the tab so it shows from the others),
 * next month, and the months after that up to this month next year (a
 * rolling year since 2026-11-11 — it used to stop at December 31, and sat
 * empty every November and December).
 *
 * The later tab leaves out bills that repeat every month — they are on the
 * month tabs, and over a window of several months they would appear again
 * and again and bury the one-offs and yearly bills that are the reason to
 * look that far ahead.
 *
 * The tab lives in the URL (`?tab=later`), as it does on Funds: opening a due
 * date and coming back should land where you were, and a row passes this
 * path along for its back button. Flipping tabs replaces the history entry
 * rather than adding one — it isn't navigating.
 *
 * Months are the user's own calendar's, not the server's.
 *
 * From lg the tabs share a toolbar row with "Add new upcoming expense" (the
 * dashed card is a phone's only), and a household with no bills at all gets
 * one empty state across the page instead of three empty tabs — there is no
 * month to look at yet, only the first bill to add. A phone keeps each tab's
 * own empty state, so it doesn't ask.
 */
export function UpcomingTabs({ onAdd }: { onAdd: () => void }) {
  const [params, setParams] = useSearchParams()
  const requested = params.get('tab')
  const tab: UpcomingTab = TABS.includes(requested as UpcomingTab)
    ? (requested as UpcomingTab)
    : 'current'

  const { current, next } = currentAndNextMonth()
  const later = laterWindow()
  // The same query as the first tab's list, so no extra fetch.
  const { occurrences } = useDue(current, { carryOverdue: true })
  const { overdue } = summarize(occurrences, localToday())
  const compact = useIsCompact()
  const bills = useUpcomingList({ enabled: !compact })

  if (!compact && bills.isSuccess && bills.expenses.length === 0) {
    return (
      <div className="mx-auto w-full max-w-140 pt-6">
        <EmptyState
          icon={CalendarCheck}
          title="No upcoming expenses"
          description="Add rent, internet or insurance and you'll see what's left to pay each month, and when."
          action={<Button onClick={onAdd}>Add upcoming expense</Button>}
        />
      </div>
    )
  }

  return (
    <Tabs
      value={tab}
      onValueChange={(value) => setParams({ tab: value }, { replace: true })}
      className="gap-4"
    >
      <div className="lg:flex lg:items-center lg:justify-between lg:gap-4">
        <TabsList className="h-10! w-full lg:w-100">
          {/* Short labels, so all three fit a phone; the months are in the
              tooltip and in each tab's own empty state. */}
          <TabsTrigger value="current" title={monthName(current)}>
            This month
            {overdue > 0 && (
              <span className="text-[11px] font-bold text-destructive tabular-nums">
                {overdue}
                <span className="sr-only"> overdue</span>
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="next" title={monthName(next)}>
            Next month
          </TabsTrigger>
          <TabsTrigger
            value="later"
            title={`${monthName(later.from)}–${monthName(later.through)}`}
          >
            Later
          </TabsTrigger>
        </TabsList>
        <Button className="hidden lg:inline-flex" onClick={onAdd}>
          <Plus />
          Add new upcoming expense
        </Button>
      </div>
      <TabsContent value="current">
        <MonthBills month={current} carryOverdue onAdd={onAdd} />
      </TabsContent>
      <TabsContent value="next">
        <MonthBills month={next} onAdd={onAdd} />
      </TabsContent>
      <TabsContent value="later">
        <MonthBills month={later.from} through={later.through} excludeMonthly onAdd={onAdd} />
      </TabsContent>
    </Tabs>
  )
}
