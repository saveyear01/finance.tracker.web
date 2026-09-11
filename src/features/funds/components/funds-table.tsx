import { useState } from 'react'

import { BreakdownList } from '@/components/breakdown-list'
import { Badge } from '@/components/ui/badge'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Table, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { isRowClick } from '@/lib/is-row-click'
import { formatMoney } from '@/lib/money'
import { cn } from '@/lib/utils'

import type { Fund } from '../types'
import { FundActions } from './fund-actions'

type Props = {
  funds: Fund[]
  onEdit: (fund: Fund) => void
  onArchive: (fund: Fund) => void
}

/**
 * Desktop rendering. The card list covers narrow screens.
 *
 * Like the cards, each fund is a shadcn `Collapsible` — rendered as its own
 * `<tbody>`, so its row and its breakdown row stay together — and one is open
 * at a time. "Held in" only names the wallets; opening the row shows how much
 * each holds. Clicking anywhere on the row opens it; the button on the name
 * is what the keyboard and screen readers use (it carries `aria-expanded`,
 * which also tints the open row).
 */
export function FundsTable({ funds, onEdit, onArchive }: Props) {
  const [openId, setOpenId] = useState<string | null>(null)

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Allocation</TableHead>
            <TableHead>Held in</TableHead>
            <TableHead className="text-right">Balance</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        {funds.map((fund) => {
          const archived = fund.archived_at !== null
          const open = openId === fund.id

          return (
            <Collapsible
              key={fund.id}
              open={open}
              onOpenChange={(next) => setOpenId(next ? fund.id : null)}
              render={<tbody />}
              className="border-b border-border last:border-0 [&>tr]:border-0"
            >
              <TableRow
                className={cn('cursor-pointer', archived && 'opacity-60')}
                onClick={(event) => {
                  if (isRowClick(event)) setOpenId(open ? null : fund.id)
                }}
              >
                <TableCell>
                  <span className="flex items-center gap-2 font-medium">
                    <CollapsibleTrigger className="rounded-sm text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
                      {fund.name}
                    </CollapsibleTrigger>
                    {archived && <Badge variant="secondary">Archived</Badge>}
                  </span>
                  {fund.allocation_percentage !== null && (
                    <span className="text-xs text-muted-foreground">
                      {fund.allocation_percentage}% of income
                    </span>
                  )}
                </TableCell>

                <TableCell className="text-muted-foreground">
                  {fund.holdings.length === 0
                    ? '—'
                    : fund.holdings.map((holding) => holding.wallet_name).join(', ')}
                </TableCell>

                <TableCell className="text-right font-medium tabular-nums">
                  {formatMoney(fund.balance)}
                </TableCell>

                <TableCell className="text-right">
                  <FundActions fund={fund} onEdit={onEdit} onArchive={onArchive} />
                </TableCell>
              </TableRow>

              <CollapsibleContent render={<tr />} className="bg-muted/50">
                <td colSpan={4} className="px-2 pt-1 pb-4">
                  <div className="max-w-md">
                    <BreakdownList
                      items={fund.holdings.map((holding) => ({
                        id: holding.wallet_id,
                        label: holding.wallet_name,
                        amount: holding.balance,
                      }))}
                      empty="No wallet holds this allocation yet."
                    />
                  </div>
                </td>
              </CollapsibleContent>
            </Collapsible>
          )
        })}
      </Table>
    </div>
  )
}
