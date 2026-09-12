import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { currentAndNextMonth, laterWindow, monthName } from '../lib/upcoming-meta'
import type { Occurrence, UpcomingExpense } from '../types'
import { MonthBills } from './month-bills'

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
 * Months are the user's own calendar's, not the server's.
 */
export function UpcomingTabs(props: {
  onAdd: () => void
  onPay: (occurrence: Occurrence) => void
  onEdit: (expense: UpcomingExpense) => void
  onDelete: (expense: UpcomingExpense) => void
}) {
  const { current, next } = currentAndNextMonth()
  const later = laterWindow()

  return (
    <Tabs defaultValue="current" className="gap-4">
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
        <MonthBills month={current} carryOverdue {...props} />
      </TabsContent>
      <TabsContent value="next">
        <MonthBills month={next} {...props} />
      </TabsContent>
      <TabsContent value="later">
        {/* An empty window (from November, when "after next month" is already
            next year) needs no special case: the API answers it with nothing,
            and the tab says so. */}
        <MonthBills month={later.from} through={later.through} excludeMonthly {...props} />
      </TabsContent>
    </Tabs>
  )
}
