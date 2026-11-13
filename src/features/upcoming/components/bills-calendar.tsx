import { Link, useLocation } from 'react-router-dom'

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
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
  ended: 'bg-muted text-muted-foreground',
}

/**
 * Every day keeps one height however many bills fall on it (2026-11-13, the
 * user's call): up to two chips, else one and "+N more", which lists the
 * day in a popover. What needs acting on sorts first, so the hidden ones are
 * never the late ones.
 */
const MAX_CHIPS = 2
const URGENCY: Record<RowStatus, number> = { overdue: 0, partial: 1, due: 2, paid: 3, skipped: 4, ended: 5 }

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
 *
 * A budget has no day, so it isn't put on the 1st: it is a chip in an "All
 * month" strip above the grid.
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
  const budgets = occurrences.filter((occurrence) => occurrence.expense.whole_month)
  const dated = occurrences.filter((occurrence) => !occurrence.expense.whole_month)
  const earlier = dated.filter((occurrence) => occurrence.due_date < `${month}-01`).length

  const byDay = new Map<string, Occurrence[]>()
  for (const occurrence of dated) {
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

      {budgets.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-background px-2 py-1.5">
          <span className="text-[10.5px] font-bold tracking-wider text-muted-foreground uppercase">All month</span>
          {budgets.map((occurrence) => (
            <BillChip
              key={occurrence.expense.id}
              occurrence={occurrence}
              today={today}
              from={`${pathname}${search}`}
              roomy
            />
          ))}
        </div>
      )}

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
          const bills = [...(byDay.get(date) ?? [])].sort(
            (a, b) => URGENCY[statusOf(a, today)] - URGENCY[statusOf(b, today)],
          )
          const shown = bills.length > MAX_CHIPS ? bills.slice(0, MAX_CHIPS - 1) : bills
          const hidden = bills.length - shown.length
          return (
            <div
              key={date}
              className={cn(
                'grid h-20 min-w-0 content-start gap-0.75 overflow-hidden rounded-lg border border-border bg-background px-1.5 py-1.5',
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
              {shown.map((occurrence) => (
                <BillChip
                  key={occurrence.expense.id}
                  occurrence={occurrence}
                  date={date}
                  today={today}
                  from={`${pathname}${search}`}
                />
              ))}
              {hidden > 0 && (
                <Popover>
                  <PopoverTrigger
                    className="block truncate rounded-[5px] bg-muted px-1.25 py-px text-left text-[10.5px] font-semibold text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={`${hidden} more on ${shortDate(date)}`}
                  >
                    +{hidden} more
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-2" align="start">
                    <p className="px-1 pb-1.5 text-xs font-semibold text-muted-foreground">
                      {shortDate(date)} · {bills.length} bills
                    </p>
                    <div className="grid gap-1">
                      {bills.map((occurrence) => (
                        <BillChip
                          key={occurrence.expense.id}
                          occurrence={occurrence}
                          date={date}
                          today={today}
                          from={`${pathname}${search}`}
                          roomy
                        />
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

/** One bill on its day: its name, coloured by where it stands, opening its page. */
function BillChip({
  occurrence,
  date,
  today,
  from,
  roomy = false,
}: {
  occurrence: Occurrence
  /** The day it's on; none for a budget, which is the whole month's. */
  date?: string
  today: string
  from: string
  /** In the "+N more" list: a little more room to read and tap. */
  roomy?: boolean
}) {
  const status = statusOf(occurrence, today)
  const label = `${occurrence.expense.name}, ${date ? shortDate(date) : 'all month'}: ${whenText(occurrence, today)}`
  return (
    <Link
      to={`/upcoming/${occurrence.expense.id}/${occurrence.due_date}`}
      state={{ from }}
      aria-label={label}
      title={label}
      className={cn(
        'block truncate rounded-[5px] font-semibold transition-opacity outline-none hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring',
        roomy ? 'px-2 py-1 text-xs' : 'px-1.25 py-px text-[10.5px]',
        CHIP_TONE[status],
      )}
    >
      {occurrence.expense.name}
    </Link>
  )
}
