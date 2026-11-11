import { format } from 'date-fns'

import { localToday } from '@/features/transactions'
import { formatMoney } from '@/lib/money'
import { cn } from '@/lib/utils'

import { fromIso } from '../lib/ranges'
import type { DayTotal, Kind } from '../types'

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

/**
 * One hue, light to dark, for how much a day came to — sequential colour,
 * never the categorical series. Four steps from the blue ramp, each relative
 * to the month's busiest day; the day's number is always printed in it, so
 * colour is never the only cue (each cell also names its amount).
 */
const STEPS = [
  'bg-[#b7d3f6] text-[#0d366b] dark:bg-[#184f95] dark:text-white',
  'bg-[#6da7ec] text-[#0d366b] dark:bg-[#256abf] dark:text-white',
  'bg-[#2a78d6] text-white dark:bg-[#3987e5] dark:text-white',
  'bg-[#184f95] text-white dark:bg-[#86b6ef] dark:text-[#0d366b]',
]

function stepOf(cents: number, max: number): string | null {
  if (cents <= 0) return null
  const ratio = cents / max
  return STEPS[ratio > 0.75 ? 3 : ratio > 0.4 ? 2 : ratio > 0.15 ? 1 : 0]
}

/**
 * A month as a calendar, each day shaded by what it came to — when the money
 * moved, which a total can't show. Month view only (a year is 365 cells).
 */
export function SpendingCalendar({ kind, days }: { kind: Kind; days: DayTotal[] }) {
  const today = localToday()
  const cents = days.map((day) => Math.round(Number(day.total) * 100))
  const max = Math.max(1, ...cents)
  const active = cents.filter((value) => value > 0).length
  const busiest = days[cents.indexOf(Math.max(...cents))]
  const lead = fromIso(days[0].date).getDay() // Sunday-first, as PH calendars are.
  const verb = kind === 'income' ? 'received' : 'spent'

  return (
    <section className="space-y-3 card-surface p-4 text-card-foreground">
      <h2 className="flex items-baseline justify-between gap-2 text-sm font-semibold">
        {kind === 'income' ? 'Income calendar' : 'Spending calendar'}
        <span className="text-xs font-normal text-muted-foreground">{format(fromIso(days[0].date), 'MMMM')}</span>
      </h2>

      <div className="grid grid-cols-7 gap-1" role="grid" aria-label={`${kind === 'income' ? 'Income' : 'Spending'} by day`}>
        {WEEKDAYS.map((day, index) => (
          <span key={index} className="pb-0.5 text-center text-[10px] font-semibold text-muted-foreground" aria-hidden="true">
            {day}
          </span>
        ))}
        {Array.from({ length: lead }, (_, index) => (
          <span key={`lead-${index}`} aria-hidden="true" />
        ))}
        {days.map((day, index) => {
          const step = stepOf(cents[index], max)
          const date = fromIso(day.date)
          return (
            <span
              key={day.date}
              role="gridcell"
              aria-label={`${format(date, 'EEE, MMM d')}: ${cents[index] > 0 ? `${formatMoney(day.total)} ${verb}` : `nothing ${verb}`}`}
              title={cents[index] > 0 ? `${format(date, 'MMM d')}: ${formatMoney(day.total)}` : undefined}
              className={cn(
                'grid aspect-square place-items-center rounded-md text-[11px] tabular-nums',
                step ? `${step} font-bold` : 'bg-muted text-muted-foreground',
                day.date === today && 'ring-2 ring-foreground/60 ring-inset',
                day.date > today && 'opacity-45',
              )}
            >
              {date.getDate()}
            </span>
          )
        })}
      </div>

      <div className="flex items-center justify-end gap-1 text-[10.5px] text-muted-foreground" aria-hidden="true">
        <span className="mr-0.5">Less</span>
        <i className="size-3 rounded-[3px] bg-muted" />
        {STEPS.map((step) => (
          <i key={step} className={cn('size-3 rounded-[3px]', step)} />
        ))}
        <span className="ml-0.5">More</span>
      </div>

      {active > 0 && busiest && (
        <p className="text-sm text-muted-foreground">
          {active} {active === 1 ? 'day' : 'days'} with {kind === 'income' ? 'income' : 'spending'}. The
          busiest was <span className="font-semibold text-foreground">{format(fromIso(busiest.date), 'EEE, MMM d')}</span> (
          {formatMoney(busiest.total)}).
        </p>
      )}
    </section>
  )
}
