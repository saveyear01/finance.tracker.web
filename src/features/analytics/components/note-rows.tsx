import { ChevronRight } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

import { formatMoney } from '@/lib/money'
import { cn } from '@/lib/utils'

import { countOf } from '../lib/kinds'
import { noteLabel, notePath, type AnalyticsRange } from '../lib/ranges'
import type { Share } from '../lib/shares'
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
 * pie's figures in full for anyone not hovering. A grey swatch is part of
 * the "Others" slice.
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

  return (
    <ul className="space-y-2">
      {shares.map((share) => (
        <li key={share.note ?? ''}>
          <Link
            to={notePath(kind, share.note, range)}
            state={{ from: `${pathname}${search}` }}
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 text-card-foreground transition-colors outline-none hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {variant === 'legend' && (
              <span
                className="size-3 shrink-0 rounded-full"
                style={{ backgroundColor: share.color }}
                aria-hidden="true"
              />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <p className={cn('truncate font-medium', share.note === null && 'italic')}>
                  {noteLabel(share.note)}
                </p>
                <span className="shrink-0 font-semibold tabular-nums">
                  {formatMoney(share.total)}
                </span>
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
      ))}
    </ul>
  )
}
