import { format } from 'date-fns'
import { ChartColumn } from 'lucide-react'

import { Button } from '@/components/ui/button'

import { KIND_WORDS } from '../lib/kinds'
import { fromIso, monthOf, rangePhrase, yearOf, type AnalyticsRange } from '../lib/ranges'
import type { Kind } from '../types'

/**
 * A period with nothing in it. Rather than a dead end, it points to the last
 * time there was any (`last_before`) — one tap to that month — or to the
 * whole year.
 */
export function EmptyPeriod({
  kind,
  range,
  lastBefore,
  onPick,
}: {
  kind: Kind
  range: AnalyticsRange
  lastBefore: string | null
  onPick: (range: AnalyticsRange) => void
}) {
  const words = KIND_WORDS[kind]
  const nothing = kind === 'income' ? 'Nothing received' : 'Nothing spent'
  const last = lastBefore ? fromIso(lastBefore) : null
  const year = yearOf(fromIso(range.window.start))

  return (
    <div className="grid justify-items-center gap-3 rounded-xl border border-dashed border-border px-5 py-8 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-muted" aria-hidden="true">
        <ChartColumn className="size-5 text-muted-foreground" />
      </span>
      <p className="text-base font-semibold">
        {nothing} {rangePhrase(range)}
      </p>
      <p className="max-w-[32ch] text-sm text-muted-foreground">
        {last
          ? `Your last ${words.one} was on ${format(last, 'MMM d, yyyy')}. ${words.tab} you record will show up here, grouped by their note.`
          : `${words.tab} you record will show up here, grouped by their note.`}
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {last && (
          <Button size="lg" onClick={() => onPick(monthOf(last))}>
            See {format(last, 'MMMM')}
          </Button>
        )}
        {range.unit === 'month' && (
          <Button size="lg" variant="outline" onClick={() => onPick(year)}>
            See all of {format(fromIso(year.window.start), 'yyyy')}
          </Button>
        )}
      </div>
    </div>
  )
}
