import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

import { formatMoney } from '@/lib/money'
import { cn } from '@/lib/utils'

import { countOf } from '../lib/kinds'
import { noteLabel, notePath, type AnalyticsRange } from '../lib/ranges'
import { OTHERS_COLOR, type Share } from '../lib/shares'
import type { Kind } from '../types'

const percentLabel = (percent: number, cents: number) =>
  percent === 0 && cents > 0 ? '<1%' : `${percent}%`

/**
 * The notes as compact rows inside one card (redesigned 2026-11-11: one 52px
 * row per note, not a 74px card each), every row opening that note's page.
 * The share bar sits under the name, amount and share on the right.
 *
 * The donut's six coloured notes come first. Then the grey slice, under its
 * own heading with its share, so grey isn't the only thing saying which rows
 * make it up: the notes past the sixth fold into one "N smaller notes" row
 * until it's tapped, and the entries with no note ("Others") always come last.
 */
export function NoteRows({
  kind,
  shares,
  range,
}: {
  kind: Kind
  shares: Share[]
  range: AnalyticsRange
}) {
  const [expanded, setExpanded] = useState(false)
  const max = Math.max(1, ...shares.map((share) => share.cents))

  const own = shares.filter((share) => share.color !== OTHERS_COLOR)
  const smaller = shares.filter((share) => share.color === OTHERS_COLOR && share.note !== null)
  const noNote = shares.find((share) => share.note === null)
  const grey = [...smaller, ...(noNote ? [noNote] : [])]
  const greyPercent = grey.reduce((sum, share) => sum + share.percent, 0)
  const smallerCents = smaller.reduce((sum, share) => sum + share.cents, 0)
  const smallerPercent = smaller.reduce((sum, share) => sum + share.percent, 0)
  const fold = smaller.length > 1 && !expanded

  return (
    <div className="-mx-4 -mb-4">
      <ul>
        {own.map((share) => (
          <Row key={share.note ?? ''} kind={kind} share={share} range={range} max={max} />
        ))}
      </ul>

      {grey.length > 0 && own.length > 0 && (
        <p className="flex justify-between border-t border-border bg-muted/40 px-4 pt-2.5 pb-1 text-xs font-semibold text-muted-foreground">
          <span>In the chart's grey slice</span>
          <span className="tabular-nums">{greyPercent}%</span>
        </p>
      )}
      <ul className={cn(own.length > 0 && 'bg-muted/40')}>
        {fold ? (
          <li className="border-t border-border first:border-t-0">
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="grid w-full grid-cols-[10px_minmax(0,1fr)_auto_16px] items-center gap-3 px-4 py-2.5 text-left transition-colors outline-none hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
            >
              <span className="size-2.5 rounded-full" style={{ backgroundColor: OTHERS_COLOR }} aria-hidden="true" />
              <span className="min-w-0">
                <span className="block truncate font-semibold">{smaller.length} smaller notes</span>
                <Track cents={smallerCents} max={max} color={OTHERS_COLOR} />
              </span>
              <span className="text-right tabular-nums">
                <span className="block font-semibold">{formatMoney(smallerCents / 100)}</span>
                <span className="block text-xs text-muted-foreground">
                  {percentLabel(smallerPercent, smallerCents)} · show them
                </span>
              </span>
              <ChevronRight className="size-4 rotate-90 text-muted-foreground" aria-hidden="true" />
            </button>
          </li>
        ) : (
          smaller.map((share) => (
            <Row key={share.note ?? ''} kind={kind} share={share} range={range} max={max} />
          ))
        )}
        {noNote && <Row kind={kind} share={noNote} range={range} max={max} />}
      </ul>
    </div>
  )
}

function Row({
  kind,
  share,
  range,
  max,
}: {
  kind: Kind
  share: Share
  range: AnalyticsRange
  max: number
}) {
  const { pathname, search } = useLocation()
  return (
    <li className="border-t border-border">
      <Link
        to={notePath(kind, share.note, range)}
        state={{ from: `${pathname}${search}` }}
        className="grid grid-cols-[10px_minmax(0,1fr)_auto_16px] items-center gap-3 px-4 py-2.5 transition-colors outline-none hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
      >
        <span
          className="size-2.5 rounded-full ring-1 ring-foreground/15 ring-inset"
          style={{ backgroundColor: share.color }}
          aria-hidden="true"
        />
        <span className="min-w-0">
          <span className={cn('block truncate font-semibold', share.note === null && 'font-medium italic')}>
            {noteLabel(share.note)}
          </span>
          <Track cents={share.cents} max={max} color={share.color} />
        </span>
        <span className="text-right tabular-nums">
          <span className="block font-semibold">{formatMoney(share.total)}</span>
          <span className="block text-xs text-muted-foreground">
            {countOf(kind, share.count)} · {percentLabel(share.percent, share.cents)}
          </span>
        </span>
        <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
      </Link>
    </li>
  )
}

function Track({ cents, max, color }: { cents: number; max: number; color: string }) {
  return (
    <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-muted" aria-hidden="true">
      <span
        className="block h-full rounded-full"
        style={{ width: `${(cents / max) * 100}%`, backgroundColor: color }}
      />
    </span>
  )
}
