import { useState } from 'react'
import { ChartPie, Inbox } from 'lucide-react'

import { BreakdownList } from '@/components/breakdown-list'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Badge } from '@/components/ui/badge'
import { formatMoney } from '@/lib/money'
import { cn } from '@/lib/utils'

import { holdingsSummary } from '../lib/fund-meta'
import type { Fund } from '../types'
import { FundActions } from './fund-actions'

type Props = {
  funds: Fund[]
  onEdit: (fund: Fund) => void
  onArchive: (fund: Fund) => void
}

/**
 * Mobile rendering: one card per fund with its total. Tapping a card opens
 * the wallets that hold it — the fund view from CLAUDE.md, on a phone; one
 * card is open at a time — each card is a shadcn `Collapsible`, and the list
 * holds which one is open.
 *
 * The actions menu sits beside the trigger rather than inside it — a button
 * can't contain another — so opening the menu never toggles the card.
 */
export function FundCards({ funds, onEdit, onArchive }: Props) {
  const [openId, setOpenId] = useState<string | null>(null)

  return (
    <ul className="space-y-3">
      {funds.map((fund) => {
        const archived = fund.archived_at !== null
        const Icon = fund.is_unallocated ? Inbox : ChartPie

        return (
          <Collapsible
            key={fund.id}
            open={openId === fund.id}
            onOpenChange={(open) => setOpenId(open ? fund.id : null)}
            render={<li />}
            className={cn(
              'rounded-xl border border-border bg-card text-card-foreground',
              archived && 'opacity-60',
            )}
          >
            <div className="flex items-start gap-2 p-4">
              <CollapsibleTrigger className="flex min-w-0 flex-1 flex-col gap-3 rounded-lg text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
                <span className="flex min-w-0 items-center gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted">
                    <Icon className="size-4 text-muted-foreground" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{fund.name}</span>
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                      {holdingsSummary(fund)}
                      {archived && <Badge variant="secondary">Archived</Badge>}
                      {/* Says why Home's total is less than these cards add up to. */}
                      {!fund.in_total && !archived && (
                        <Badge variant="outline">Not in total</Badge>
                      )}
                    </span>
                  </span>
                </span>
                <span className="text-xl font-semibold tabular-nums">
                  {formatMoney(fund.balance)}
                </span>
              </CollapsibleTrigger>

              <FundActions fund={fund} onEdit={onEdit} onArchive={onArchive} />
            </div>

            {/* Height animates between 0 and the content's; the padding lives
                on the inner div so the panel can close to 0. */}
            <CollapsibleContent className="h-(--collapsible-panel-height) overflow-hidden transition-[height] duration-200 ease-out data-ending-style:h-0 data-starting-style:h-0 motion-reduce:transition-none">
              <div className="px-4 pb-4">
                <BreakdownList
                  items={fund.holdings.map((holding) => ({
                    id: holding.wallet_id,
                    label: holding.wallet_name,
                    amount: holding.balance,
                  }))}
                  empty="No wallet holds this allocation yet."
                />
              </div>
            </CollapsibleContent>
          </Collapsible>
        )
      })}
    </ul>
  )
}
