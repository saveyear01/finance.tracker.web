import { ChevronRight, CircleAlert } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Skeleton } from '@/components/ui/skeleton'
import { localToday } from '@/features/transactions'
import { getApiErrorMessage } from '@/lib/api-client'
import { formatMoney } from '@/lib/money'

import { useDue, usePinned } from '../hooks/use-upcoming'
import { currentAndNextMonth, summarize } from '../lib/upcoming-meta'
import { BillRow } from './bill-row'
import { DueSummary } from './due-summary'

/**
 * Home's bills (redesigned 2026-11-11, replacing the Upcoming row and the
 * separate Pinned list): this month's still to pay, overdue included, as the
 * same summary the Upcoming tab opens with — and, when the bills left outrun
 * the balance on the card above, by how much. The same query as that tab, so
 * opening it is instant.
 *
 * Under them, the pinned bills (decided 2026-09-24: this month's, paid ones
 * included), in the same date-tile rows as Upcoming.
 */
export function DueThisMonth({
  balanceCents,
  setAsideCents,
}: {
  /** What the balance card shows — the allocations that count. */
  balanceCents: number
  /** What the allocations left out of it hold. */
  setAsideCents: number
}) {
  const { current } = currentAndNextMonth()
  const today = localToday()
  const due = useDue(current, { carryOverdue: true })
  const pinned = usePinned(current)

  if (due.isLoading) return <Skeleton className="h-64 w-full rounded-xl" />

  const shortBy = summarize(due.occurrences, today).toPayCents - balanceCents

  return (
    <section className="space-y-3 card-surface p-4 text-card-foreground" aria-labelledby="due-heading">
      <div className="flex items-baseline justify-between gap-2">
        <h2 id="due-heading" className="text-sm font-semibold">
          Due this month
        </h2>
        <Link
          to="/upcoming"
          className="inline-flex items-center gap-0.5 text-sm font-medium text-primary hover:underline"
        >
          See all
          <ChevronRight className="size-4" aria-hidden="true" />
        </Link>
      </div>

      {due.isError ? (
        <p className="text-sm text-destructive">{getApiErrorMessage(due.error, 'Could not load your bills.')}</p>
      ) : due.occurrences.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing due this month.</p>
      ) : (
        <>
          <DueSummary occurrences={due.occurrences} today={today} />
          {shortBy > 0 && (
            <p className="flex gap-2.5 rounded-lg bg-muted px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
              <CircleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              <span>
                That's <b className="font-semibold text-foreground">{formatMoney(shortBy / 100)} more</b> than your
                total balance.
                {setAsideCents > 0 &&
                  ` Another ${formatMoney(setAsideCents / 100)} is set aside in allocations left out of it.`}
              </span>
            </p>
          )}
        </>
      )}

      <div className="-mx-4 -mb-4">
        <h3 className="px-4 pt-1 pb-2 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
          Pinned
        </h3>
        {pinned.isLoading ? (
          <Skeleton className="mx-4 mb-4 h-16 rounded-lg" />
        ) : pinned.isError ? (
          <p className="border-t border-border px-4 py-3 text-sm text-destructive">
            {getApiErrorMessage(pinned.error, 'Could not load your pinned expenses.')}
          </p>
        ) : pinned.occurrences.length === 0 ? (
          <p className="border-t border-border px-4 py-3 text-sm text-muted-foreground">
            Open an upcoming expense and pin it to keep it here in the months it's due.
          </p>
        ) : (
          <ul className="border-t border-border">
            {pinned.occurrences.map((occurrence) => (
              <BillRow key={`${occurrence.expense.id}:${occurrence.due_date}`} occurrence={occurrence} today={today} />
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
