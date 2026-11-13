import { Check, ChevronRight } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

import { formatMoney } from '@/lib/money'
import { cn } from '@/lib/utils'

import { formatRate, monthlyCost, progressOf, RATE_KIND_BADGES, standingOf } from '../lib/debt-meta'
import type { Debt } from '../types'

const TONES = {
  bad: 'font-semibold text-destructive',
  good: 'font-semibold text-success',
  neutral: '',
} as const

/**
 * One debt in the list. An open one leads with its RANK — the household's
 * priority, which is what the list is ordered by — then who and at what
 * rate, what's left, and a bar of how far through it you are.
 *
 * Under the bar, every row says the same two things in the same places, so
 * the list scans down: what a month of it costs, and where it stands
 * ("19 payments behind", "On track", "No end date"). Both wrap rather than
 * truncate — on a phone, the half that gets cut is the half you needed.
 *
 * A paid-off one is ticked and shows what was paid; no strike-through,
 * which reads as cancelled rather than cleared.
 *
 * `selected` marks the debt open beside the list on a big screen (SplitView):
 * the accent ground and a primary bar down its leading edge.
 */
export function DebtRow({
  debt,
  rank,
  selected = false,
}: {
  debt: Debt
  rank: number | null
  selected?: boolean
}) {
  const { pathname } = useLocation()
  // Back from a debt goes to the LIST, even when the row was tapped beside
  // another debt (split view) — the page it was "opened from" there is a
  // debt, and going back to it would be a step sideways.
  const from = pathname.startsWith('/debts/') ? '/debts' : pathname
  const open = debt.status === 'open'
  const progress = progressOf(debt)
  const rate = formatRate(debt.current_rate)
  const badge = RATE_KIND_BADGES[debt.rate_kind]
  const cost = monthlyCost(debt)
  const standing = standingOf(debt)
  const charged = Number(debt.charged) > 0

  const detail = [debt.lender, rate && (badge ? `${rate} ${badge.toLowerCase()}` : rate)]
    .filter(Boolean)
    .join(' · ')

  return (
    <li className="border-border not-first:border-t">
      <Link
        to={`/debts/${debt.id}`}
        state={{ from }}
        aria-current={selected ? 'page' : undefined}
        className={cn(
          'grid grid-cols-[1.75rem_minmax(0,1fr)_auto_1rem] items-center gap-x-3 gap-y-1 px-4 py-3 transition-colors outline-none hover:bg-muted/60 focus-visible:bg-muted/60',
          selected &&
            'bg-accent shadow-[inset_3px_0_0_var(--color-primary)] hover:bg-accent focus-visible:bg-accent',
        )}
      >
        <span
          className={cn(
            'grid size-7 place-items-center rounded-full text-xs font-bold tabular-nums',
            open ? 'bg-muted text-foreground' : 'bg-success/10 text-success',
          )}
          aria-label={open && rank !== null ? `Priority ${rank}` : 'Paid off'}
        >
          {open && rank !== null ? rank : <Check className="size-3.5" aria-hidden="true" />}
        </span>

        <div className="min-w-0">
          <p className="font-medium break-words">{debt.name}</p>
          {detail && <p className="text-xs text-muted-foreground">{detail}</p>}
        </div>

        <p className="text-right font-semibold tabular-nums">
          {formatMoney(open ? debt.remaining : debt.paid)}
          <span className="block text-xs font-medium text-muted-foreground">
            {open ? `${progress}% paid` : 'paid off'}
          </span>
        </p>
        <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />

        {open && (
          <>
            <div
              className="col-span-2 col-start-2 h-1.5 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${debt.name} paid off`}
            >
              <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
            </div>
            <p className="col-span-2 col-start-2 flex flex-wrap gap-x-2.5 text-xs text-muted-foreground">
              {cost && (
                <span>
                  {formatMoney(cost.amount)} {cost.label}
                </span>
              )}
              <span className={TONES[standing.tone]}>{standing.label}</span>
              {charged && !debt.schedule && <span>{formatMoney(debt.charged)} added</span>}
            </p>
          </>
        )}
      </Link>
    </li>
  )
}
