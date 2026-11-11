import { Info } from 'lucide-react'

import { KIND_WORDS } from '../lib/kinds'
import { noteLabel, type AnalyticsRange } from '../lib/ranges'
import type { Share } from '../lib/shares'
import type { Kind } from '../types'
import { NotePie } from './note-pie'
import { NoteRows } from './note-rows'

/** Past this share of the money with no note, the card says how to fix it. */
const NO_NOTE_HINT = 50

/**
 * Where the money went (or came from), by note: the donut with the total in
 * its centre and the three biggest beside it, then every note as a compact
 * row. When most of it has no note, a hint says how to make this useful.
 */
export function BreakdownCard({
  kind,
  shares,
  range,
}: {
  kind: Kind
  shares: Share[]
  range: AnalyticsRange
}) {
  const words = KIND_WORDS[kind]
  const noNote = shares.find((share) => share.note === null)
  const top = shares.filter((share) => share.note !== null).slice(0, 3)
  const named = shares.filter((share) => share.note !== null).length

  return (
    <>
      {noNote && noNote.percent >= NO_NOTE_HINT && (
        <div className="flex gap-3 rounded-xl bg-accent p-3.5 text-sm text-accent-foreground">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>
            <span className="block font-semibold">
              {noNote.percent}% of this {kind === 'income' ? 'income' : 'spending'} has no note
            </span>
            Add a note when you record {kind === 'income' ? 'income, such as “Salary” or “Freelance”,' : 'an expense, such as “Groceries” or “Rent”,'}{' '}
            to see where your money {kind === 'income' ? 'comes from' : 'goes'}.
          </p>
        </div>
      )}

      <section className="space-y-4 card-surface p-4 text-card-foreground">
        <h2 className="flex items-baseline justify-between gap-2 text-sm font-semibold">
          {words.heading}
          <span className="text-xs font-normal text-muted-foreground">
            {named} {named === 1 ? 'note' : 'notes'}
          </span>
        </h2>

        <div className="flex items-center gap-4">
          <NotePie shares={shares} caption={kind === 'income' ? 'received' : 'spent'} />
          {/* The biggest three by name — a glance; the rows below have them all. */}
          <ul className="min-w-0 flex-1 space-y-2 text-xs" aria-hidden="true">
            {(top.length > 0 ? top : shares.slice(0, 3)).map((share) => (
              <li key={share.note ?? ''} className="grid grid-cols-[10px_minmax(0,1fr)_auto] items-center gap-2">
                <span className="size-2.5 rounded-full ring-1 ring-foreground/15 ring-inset" style={{ backgroundColor: share.color }} />
                <span className="truncate">{noteLabel(share.note)}</span>
                <span className="text-muted-foreground tabular-nums">
                  {share.percent === 0 && share.cents > 0 ? '<1%' : `${share.percent}%`}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <NoteRows kind={kind} shares={shares} range={range} />
      </section>
    </>
  )
}
