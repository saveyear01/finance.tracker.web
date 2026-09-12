import { ChevronRight, CircleCheck, Landmark } from 'lucide-react'
import { Link } from 'react-router-dom'

import { formatMoney } from '@/lib/money'
import { cn } from '@/lib/utils'

import { formatRate, progressOf, RATE_KIND_BADGES } from '../lib/debt-meta'
import type { Debt } from '../types'

/**
 * One debt in the list: its name and lender, what's left of it, and how far
 * through you are. A paid-off one stays, muted and ticked, since clearing a
 * debt is worth seeing.
 *
 * The whole row opens the debt's own page — everything you can DO to a debt
 * lives there, so the list stays a list and reads at a glance on a phone.
 *
 * The amount shown is what's LEFT — the principal never changes as you pay,
 * and anything charged since is folded into what's owed, so the line under
 * the bar says how the two relate. Who and at what rate goes above the bar,
 * how much is paid below: together on one line they truncate on a phone, and
 * what goes first is the half that matters.
 */
export function DebtRow({ debt }: { debt: Debt }) {
  const open = debt.status === 'open'
  const Icon = open ? Landmark : CircleCheck
  const progress = progressOf(debt)
  const rate = formatRate(debt.current_rate)
  const badge = RATE_KIND_BADGES[debt.rate_kind]
  const charged = Number(debt.charged) > 0

  // Short enough to survive a narrow screen: who, and on what terms. The
  // term is left to the line below — three of these truncate on a phone, and
  // the one that gets cut is the one the reader needs.
  const detail =
    [debt.lender, rate && (badge ? `${rate} ${badge.toLowerCase()}` : rate)]
      .filter(Boolean)
      .join(' · ') || (open ? 'Open' : 'Paid off')
  // Under the bar: what a month costs, which is the number you act on. The
  // term that produced it is on the debt's own page — on a phone this line
  // fits one figure, and this is the one. Without a schedule there is nothing
  // to be due, so the figures the bar is drawing go there instead.
  const progressLabel = !open
    ? `${formatMoney(debt.paid)} paid off`
    : debt.monthly_payment
      ? `${formatMoney(debt.monthly_payment)} a month`
      : `${formatMoney(debt.paid)} of ${formatMoney(debt.owed)} paid` +
        (charged ? ` · ${formatMoney(debt.charged)} added` : '')

  return (
    <li>
      <Link
        to={`/debts/${debt.id}`}
        className={cn(
          'flex items-center gap-3 rounded-xl border border-border bg-card p-3 text-card-foreground transition-colors outline-none hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50',
          !open && 'opacity-70',
        )}
      >
        <span
          className={cn(
            'grid size-10 shrink-0 place-items-center rounded-full',
            open ? 'bg-muted text-muted-foreground' : 'bg-success/10 text-success',
          )}
        >
          <Icon className="size-4" aria-hidden="true" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{debt.name}</p>
          <p className="truncate text-xs text-muted-foreground">{detail}</p>
          {open && (
            <>
              <div
                className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-muted"
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${debt.name} paid off`}
              >
                <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-1 truncate text-xs text-muted-foreground">{progressLabel}</p>
            </>
          )}
        </div>

        <span
          className={cn(
            'shrink-0 font-semibold tabular-nums',
            !open && 'text-muted-foreground line-through',
          )}
        >
          {formatMoney(open ? debt.remaining : debt.paid)}
        </span>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </Link>
    </li>
  )
}
