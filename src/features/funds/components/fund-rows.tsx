import { useMemo } from 'react'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { formatMoney } from '@/lib/money'
import { cn } from '@/lib/utils'

import { useFunds } from '../hooks/use-funds'
import { fundColors, OTHER_FUND_COLOR } from '../lib/fund-colors'
import type { Fund } from '../types'

/** Which wallets hold it — said for a screen reader; the page lists them. */
function heldIn(fund: Fund): string {
  if (fund.holdings.length === 0) return 'Empty'
  return `In ${fund.holdings.map((holding) => holding.wallet_name).join(', ')}`
}

/**
 * Allocations as rows in one card: a dot in the allocation's own colour (the
 * one it wears in the wallets' bars and the income split above), the name
 * and the balance — red when borrowed against, dimmed when empty. A row opens
 * the allocation's own page, where it is renamed, archived or left out of
 * Home's total; rows carry no menu (lists are lists).
 *
 * Minimal since 2026-11-13, with the Wallets tab (mockup
 * `design/funds-wallets-minimal.html`): each fact said once. No share-of-income
 * badge (the Income split card above the list says it), no "BPI, BDO" line
 * (the allocation's page lists its wallets), no chevron (the whole row is the
 * link; hover and press show it).
 *
 * `total` (cents) closes the list with a quiet "Total" row (2026-11-13).
 *
 * `selectedId` marks the allocation open beside the list on a big screen
 * (the split view): an accent row with a primary bar on its left edge, and
 * `aria-current` so a screen reader hears which one it is.
 */
export function FundRows({
  funds,
  from,
  selectedId,
  total,
}: {
  funds: Fund[]
  from: string
  selectedId?: string
  /** In cents; drawn as the list's last row when given. */
  total?: number
}) {
  // Colours are handed out over every active allocation, in the API's order,
  // so a row wears the same one whichever section it is in.
  const { funds: active } = useFunds()
  const colors = useMemo(() => fundColors(active), [active])

  return (
    <ul className="overflow-hidden card-surface text-card-foreground">
      {funds.map((fund) => {
        const archived = fund.archived_at !== null
        const selected = fund.id === selectedId
        const cents = Math.round(Number(fund.balance) * 100)
        return (
          <li key={fund.id} className="border-border not-first:border-t">
            <Link
              to={`/allocations/${fund.id}`}
              state={{ from }}
              aria-current={selected ? 'page' : undefined}
              className={cn(
                'flex min-h-14 items-center gap-3 px-4 py-3 transition-colors outline-none hover:bg-muted/60 focus-visible:bg-muted/60 active:bg-muted',
                archived && 'opacity-60',
                selected &&
                  'relative bg-accent before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-primary hover:bg-accent focus-visible:bg-accent',
              )}
            >
              <span
                className="size-2.5 shrink-0 rounded-[3px]"
                style={{ backgroundColor: colors.get(fund.id) ?? OTHER_FUND_COLOR }}
                aria-hidden="true"
              />
              <span className="flex min-w-0 flex-1 items-center gap-2">
                <span className="truncate font-medium">{fund.name}</span>
                <span className="sr-only">
                  .{fund.allocation_percentage !== null && ` ${fund.allocation_percentage}% of income.`} {heldIn(fund)}.
                </span>
                {archived && <Badge variant="secondary">Archived</Badge>}
              </span>
              <span
                className={cn(
                  'shrink-0 font-semibold tabular-nums',
                  cents < 0 && 'text-destructive',
                  cents === 0 && 'font-medium text-muted-foreground',
                )}
              >
                {formatMoney(fund.balance)}
              </span>
            </Link>
          </li>
        )
      })}
      {total !== undefined && (
        <li className="flex items-center justify-between gap-3 border-t border-border bg-muted/40 px-4 py-2.5 text-sm text-muted-foreground">
          <span>Total</span>
          <span className="font-medium tabular-nums">
            {total < 0 ? '−' : ''}
            {formatMoney(Math.abs(total) / 100)}
          </span>
        </li>
      )}
    </ul>
  )
}
