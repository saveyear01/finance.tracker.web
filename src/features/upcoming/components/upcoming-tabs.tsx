import { useSearchParams } from 'react-router-dom'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { currentAndNextMonth, laterWindow, monthName } from '../lib/upcoming-meta'
import { MonthBills } from './month-bills'

const TABS = ['current', 'next', 'later'] as const
type UpcomingTab = (typeof TABS)[number]

/**
 * The upcoming expenses in three tabs: this month (with anything overdue
 * carried in), next month, and everything after that to the end of the year.
 *
 * The later tab leaves out bills that repeat every month — they are on the
 * month tabs, and over a window of several months they would appear again
 * and again and bury the one-offs and yearly bills that are the reason to
 * look that far ahead. It stops at the year's end rather than running on
 * indefinitely, so what it shows stays something you can still act on.
 *
 * The tab lives in the URL (`?tab=later`), as it does on Funds: opening a due
 * date and coming back should land where you were, and a row passes this
 * path along for its back button. Flipping tabs replaces the history entry
 * rather than adding one — it isn't navigating.
 *
 * Months are the user's own calendar's, not the server's.
 */
export function UpcomingTabs({ onAdd }: { onAdd: () => void }) {
  const [params, setParams] = useSearchParams()
  const requested = params.get('tab')
  const tab: UpcomingTab = TABS.includes(requested as UpcomingTab)
    ? (requested as UpcomingTab)
    : 'current'

  const { current, next } = currentAndNextMonth()
  const later = laterWindow()

  return (
    <Tabs
      value={tab}
      onValueChange={(value) => setParams({ tab: value }, { replace: true })}
      className="gap-4"
    >
      <TabsList className="h-10! w-full">
        {/* Short labels, so all three fit a phone; the months are in the
            tooltip and in each tab's own empty state. */}
        <TabsTrigger value="current" title={monthName(current)}>
          This month
        </TabsTrigger>
        <TabsTrigger value="next" title={monthName(next)}>
          Next month
        </TabsTrigger>
        <TabsTrigger
          value="later"
          title={
            later.empty
              ? `Nothing left in ${later.through.slice(0, 4)}`
              : `${monthName(later.from)}–${monthName(later.through)}`
          }
        >
          Later
        </TabsTrigger>
      </TabsList>
      <TabsContent value="current">
        <MonthBills month={current} carryOverdue onAdd={onAdd} />
      </TabsContent>
      <TabsContent value="next">
        <MonthBills month={next} onAdd={onAdd} />
      </TabsContent>
      <TabsContent value="later">
        {/* An empty window (from November, when "after next month" is already
            next year) needs no special case: the API answers it with nothing,
            and the tab says so. */}
        <MonthBills month={later.from} through={later.through} excludeMonthly onAdd={onAdd} />
      </TabsContent>
    </Tabs>
  )
}
