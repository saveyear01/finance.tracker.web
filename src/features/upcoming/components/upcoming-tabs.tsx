import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { currentAndNextMonth, monthName } from '../lib/upcoming-meta'
import type { Occurrence, UpcomingExpense } from '../types'
import { MonthBills } from './month-bills'

/**
 * The upcoming expenses, a month per tab: this month (with anything overdue
 * carried in) and next month. Months are the user's own calendar's.
 */
export function UpcomingTabs(props: {
  onAdd: () => void
  onPay: (occurrence: Occurrence) => void
  onEdit: (expense: UpcomingExpense) => void
  onDelete: (expense: UpcomingExpense) => void
}) {
  const { current, next } = currentAndNextMonth()

  return (
    <Tabs defaultValue="current" className="gap-4">
      <TabsList className="h-10! w-full">
        {/* Short labels, so both fit a phone; the month names are in the
            tooltip and in each month's own empty state. */}
        <TabsTrigger value="current" title={monthName(current)}>
          This month
        </TabsTrigger>
        <TabsTrigger value="next" title={monthName(next)}>
          Next month
        </TabsTrigger>
      </TabsList>
      <TabsContent value="current">
        <MonthBills month={current} carryOverdue {...props} />
      </TabsContent>
      <TabsContent value="next">
        <MonthBills month={next} {...props} />
      </TabsContent>
    </Tabs>
  )
}
