import { ChevronRight } from 'lucide-react'
import { useId } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { formatMoney } from '@/lib/money'
import { cn } from '@/lib/utils'

import { countOf } from '../lib/kinds'
import { noteLabel, notePath, type AnalyticsRange } from '../lib/ranges'
import { OTHERS_COLOR, type Share } from '../lib/shares'
import type { Kind } from '../types'

const percentLabel = (share: Share) =>
  share.percent === 0 && share.cents > 0 ? '<1%' : `${share.percent}%`

/**
 * One row per note, each opening that note's own page — the same rows under
 * both views, so a note reads alike whichever is picked.
 *
 * As the `list` they carry a bar of their share. As the pie's `legend` they
 * carry their slice's colour instead: the legend is what names the slices,
 * so the pie never asks anyone to match colours from memory, and it is the
 * pie's figures in full for anyone not hovering.
 *
 * The pie's grey "Others" slice can hold more than the "Others" row (entries
 * with no note) — it also takes the notes past the palette. So in the legend
 * those rows sit under their own heading with the slice's share, rather than
 * leaving a grey dot as the only sign of which rows make it up.
 */
export function NoteRows({
  kind,
  shares,
  range,
  variant,
}: {
  kind: Kind
  shares: Share[]
  range: AnalyticsRange
  variant: 'list' | 'legend'
}) {
  const { pathname, search } = useLocation()
  const total = shares.reduce((sum, share) => sum + share.cents, 0)
  const headingId = useId()

  const row = (share: Share) => (
    <li key={share.note ?? ''}>
      <Link
        to={notePath(kind, share.note, range)}
        state={{ from: `${pathname}${search}` }}
        className="card-row flex items-center gap-3 p-3 text-card-foreground"
      >
        {variant === 'legend' && (
          <span
            className="size-3 shrink-0 rounded-full ring-1 ring-foreground/15 ring-inset"
            style={{ backgroundColor: share.color }}
            aria-hidden="true"
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <p className={cn('truncate font-medium', share.note === null && 'italic')}>
              {noteLabel(share.note)}
            </p>
            <span className="shrink-0 font-semibold tabular-nums">{formatMoney(share.total)}</span>
          </div>
          {variant === 'list' && (
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${total > 0 ? (share.cents / total) * 100 : 0}%` }}
              />
            </div>
          )}
          <p className="mt-1 flex justify-between text-xs text-muted-foreground">
            <span>{countOf(kind, share.count)}</span>
            <span className="tabular-nums">{percentLabel(share)}</span>
          </p>
        </div>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </Link>
    </li>
  )

  const own = variant === 'legend' ? shares.filter((share) => share.color !== OTHERS_COLOR) : shares
  const folded = variant === 'legend' ? shares.filter((share) => share.color === OTHERS_COLOR) : []
  // Only worth a heading when the slice is more than the one "Others" row.
  const grouped = folded.length > 1 || folded.some((share) => share.note !== null)
  const foldedPercent = folded.reduce((sum, share) => sum + share.percent, 0)

  return (
    <div className="space-y-2">
      <ul className="space-y-2">
        {own.map(row)}
        {!grouped && folded.map(row)}
      </ul>
      {grouped && (
        <>
          <p
            id={headingId}
            className="flex justify-between px-1 pt-2 text-xs font-semibold text-muted-foreground"
          >
            <span>In the chart's Others slice</span>
            <span className="tabular-nums">{foldedPercent}%</span>
          </p>
          <ul className="space-y-2" aria-labelledby={headingId}>
            {folded.map(row)}
          </ul>
        </>
      )}
    </div>
  )
}
