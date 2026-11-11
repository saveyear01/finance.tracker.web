import { ChartPie, ChevronRight, Inbox } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { formatMoney } from '@/lib/money'
import { cn } from '@/lib/utils'

import type { Fund } from '../types'

/** One line under an allocation's name: which wallets hold it. */
function heldIn(fund: Fund): string {
  if (fund.holdings.length === 0) return 'Empty'
  const names = fund.holdings.map((holding) => holding.wallet_name)
  return names.length > 3 ? `${names.slice(0, 2).join(', ')} +${names.length - 2}` : names.join(', ')
}

/**
 * Allocations as rows in one card (2026-11-11, replacing the cards and the
 * table): the name, the wallets holding it, its share of the income split
 * when it has one, and the balance — red when borrowed against. A row opens
 * the allocation's own page, where it is renamed, archived or left out of
 * Home's total; rows carry no menu (lists are lists).
 */
export function FundRows({ funds, from }: { funds: Fund[]; from: string }) {
  return (
    <ul className="overflow-hidden card-surface text-card-foreground">
      {funds.map((fund) => {
        const Icon = fund.is_unallocated ? Inbox : ChartPie
        const archived = fund.archived_at !== null
        return (
          <li key={fund.id} className="border-border not-first:border-t">
            <Link
              to={`/funds/allocations/${fund.id}`}
              state={{ from }}
              className={cn(
                'flex items-center gap-3 px-4 py-3 transition-colors outline-none hover:bg-muted/60 focus-visible:bg-muted/60',
                archived && 'opacity-60',
              )}
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted" aria-hidden="true">
                <Icon className="size-4 text-muted-foreground" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span className="truncate font-medium">{fund.name}</span>
                  {fund.allocation_percentage !== null && (
                    <Badge variant="secondary" className="bg-accent text-accent-foreground">
                      {fund.allocation_percentage}% of income
                    </Badge>
                  )}
                  {archived && <Badge variant="secondary">Archived</Badge>}
                </span>
                <span className="block truncate text-xs text-muted-foreground">{heldIn(fund)}</span>
              </span>
              <span
                className={cn('shrink-0 font-semibold tabular-nums', Number(fund.balance) < 0 && 'text-destructive')}
              >
                {formatMoney(fund.balance)}
              </span>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
