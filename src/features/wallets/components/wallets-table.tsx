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

import { useWalletBreakdowns } from '../hooks/use-wallet-breakdowns'
import { WALLET_TYPE_META } from '../lib/wallet-meta'
import type { Wallet } from '../types'
import { WalletActions } from './wallet-actions'

type Props = {
  wallets: Wallet[]
  onEdit: (wallet: Wallet) => void
  onArchive: (wallet: Wallet) => void
}

/**
 * Desktop rendering. The card list covers narrow screens.
 *
 * Like the cards, each wallet is a shadcn `Collapsible` — rendered as its own
 * `<tbody>`, so its row and its breakdown row stay together — and one is open
 * at a time. Clicking anywhere on the row opens it; the button on the name
 * is what the keyboard and screen readers use (it carries `aria-expanded`,
 * which also tints the open row).
 */
export function WalletsTable({ wallets, onEdit, onArchive }: Props) {
  const [openId, setOpenId] = useState<string | null>(null)
  const breakdowns = useWalletBreakdowns()

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Balance</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        {wallets.map((wallet) => {
          const { label, icon: Icon } = WALLET_TYPE_META[wallet.type]
          const archived = wallet.archived_at !== null
          const open = openId === wallet.id

          return (
            <Collapsible
              key={wallet.id}
              open={open}
              onOpenChange={(next) => setOpenId(next ? wallet.id : null)}
              render={<tbody />}
              className="border-b border-border last:border-0 [&>tr]:border-0"
            >
              <TableRow
                className={cn('cursor-pointer', archived && 'opacity-60')}
                onClick={(event) => {
                  if (isRowClick(event)) setOpenId(open ? null : wallet.id)
                }}
              >
                <TableCell>
                  <span className="flex items-center gap-2 font-medium">
                    <CollapsibleTrigger className="rounded-sm text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
                      {wallet.name}
                    </CollapsibleTrigger>
                    {archived && <Badge variant="secondary">Archived</Badge>}
                  </span>
                </TableCell>

                <TableCell className="text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <Icon className="size-4" />
                    {label}
                  </span>
                </TableCell>

                <TableCell className="text-right font-medium tabular-nums">
                  {formatMoney(wallet.balance)}
                </TableCell>

                <TableCell className="text-right">
                  <WalletActions wallet={wallet} onEdit={onEdit} onArchive={onArchive} />
                </TableCell>
              </TableRow>

              <CollapsibleContent render={<tr />} className="bg-muted/50">
                <td colSpan={4} className="px-2 pt-1 pb-4">
                  <div className="max-w-md">
                    <BreakdownList
                      items={breakdowns.get(wallet.id) ?? []}
                      empty="Nothing in this wallet yet."
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
