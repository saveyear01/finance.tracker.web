import { Link, useLocation } from 'react-router-dom'

import { cn } from '@/lib/utils'

import { monthTitle, shortDate, statusOf, whenText, type RowStatus } from '../lib/upcoming-meta'
import type { Occurrence } from '../types'

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

/**
 * A chip's colour says where the bill stands, as the row's tile does — red
 * once late, green once paid, quiet while simply coming. The name is always
 * printed in it, so colour is never the only cue; a skipped one is struck
 * through as its row's amount is.
 */
const CHIP_TONE: Record<RowStatus, string> = {
  overdue: 'bg-destructive/10 text-destructive',
  paid: 'bg-success/10 text-success',
  partial: 'bg-muted text-foreground',
  due: 'bg-muted text-foreground',
  skipped: 'bg-muted text-muted-foreground line-through',
}

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * The month as a calendar beside Upcoming's list, from lg
 * (design/large-screen.html): each bill on its day as a chip, coloured by
 * where it stands, so when the money goes out reads at a glance — which the
 * list, sorted the same way, can only say in words. Today is outlined.
 *
 * Sunday first, as the Analytics spending calendar is (and PH calendars
 * are). A chip opens that due date's page, carrying where it came from for
 * the back button, exactly as a row does.
 *
 * Only the month's own days are drawn: overdue bills the current month
 * carries in from earlier months have no cell here, so the header counts
 * them — they are at the top of the list beside it.
 */
export function BillsCalendar({
  month,
  occurrences,
  today,
}: {
  /** YYYY-MM. */
  month: string
  occurrences: Occurrence[]
  /** YYYY-MM-DD in the user's timezone. */
  today: string
}) {
  const { pathname, search } = useLocation()
  const [year, monthIndex] = month.split('-').map(Number)
  const lead = new Date(year, monthIndex - 1, 1).getDay()
  const length = new Date(year, monthIndex, 0).getDate()
  const days = Array.from({ length }, (_, index) => `${month}-${pad(index + 1)}`)
  const earlier = occurrences.filter((occurrence) => occurrence.due_date < `${month}-01`).length

  const byDay = new Map<string, Occurrence[]>()
  for (const occurrence of occurrences) {
    const list = byDay.get(occurrence.due_date)
    if (list) list.push(occurrence)
    else byDay.set(occurrence.due_date, [occurrence])
  }

  return (
    <section className="space-y-3 card-surface p-4 text-card-foreground" aria-label={`${monthTitle(month)} calendar`}>
      <h2 className="flex items-baseline justify-between gap-3 text-sm font-semibold">
        {monthTitle(month)}
        <span className="text-xs font-normal text-muted-foreground">
          {[
            today.startsWith(month) && `Today is ${shortDate(today)}`,
            earlier > 0 && `${earlier} from earlier months`,
          ]
            .filter(Boolean)
            .join(' · ')}
        </span>
      </h2>

      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((day, index) => (
          <span
            key={index}
            className="pb-0.5 text-center text-[10.5px] font-bold tracking-wider text-muted-foreground"
            aria-hidden="true"
          >
            {day}
          </span>
        ))}
        {Array.from({ length: lead }, (_, index) => (
          <span key={`lead-${index}`} aria-hidden="true" />
        ))}
        {days.map((date) => {
          const bills = byDay.get(date) ?? []
          return (
            <div
              key={date}
              className={cn(
                'grid min-h-16 min-w-0 content-start gap-0.75 rounded-lg border border-border bg-background px-1.5 py-1.5',
                date === today && 'border-primary ring-1 ring-primary ring-inset',
              )}
            >
              <span
                className={cn(
                  'text-xs font-semibold tabular-nums',
                  date === today ? 'text-primary' : 'text-foreground',
                )}
                aria-hidden={bills.length === 0}
              >
                {Number(date.slice(8))}
              </span>
              {bills.map((occurrence) => {
                const status = statusOf(occurrence, today)
                const label = `${occurrence.expense.name}, ${shortDate(date)}: ${whenText(occurrence, today)}`
                return (
                  <Link
                    key={occurrence.expense.id}
                    to={`/upcoming/${occurrence.expense.id}/${occurrence.due_date}`}
                    state={{ from: `${pathname}${search}` }}
                    aria-label={label}
                    title={label}
                    className={cn(
                      'block truncate rounded-[5px] px-1.25 py-px text-[10.5px] font-semibold transition-opacity outline-none hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring',
                      CHIP_TONE[status],
                    )}
                  >
                    {occurrence.expense.name}
                  </Link>
                )
              })}
            </div>
          )
        })}
      </div>
    </section>
  )
}
