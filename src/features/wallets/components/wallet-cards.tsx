import { useState } from 'react'

import { BreakdownList } from '@/components/breakdown-list'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Badge } from '@/components/ui/badge'
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
 * Mobile rendering: one card per wallet, with the balance — the thing you scan
 * for — given its own weight. Tapping a card opens what the wallet holds, by
 * fund; one card is open at a time — each card is a shadcn `Collapsible`, and the
 * list holds which one is open.
 *
 * The actions menu sits beside the trigger rather than inside it — a button
 * can't contain another — so opening the menu never toggles the card.
 */
export function WalletCards({ wallets, onEdit, onArchive }: Props) {
  const [openId, setOpenId] = useState<string | null>(null)
  const breakdowns = useWalletBreakdowns()

  return (
    <ul className="space-y-3">
      {wallets.map((wallet) => {
        const { label, icon: Icon } = WALLET_TYPE_META[wallet.type]
        const archived = wallet.archived_at !== null

        return (
          <Collapsible
            key={wallet.id}
            open={openId === wallet.id}
            onOpenChange={(open) => setOpenId(open ? wallet.id : null)}
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
                    <span className="block truncate font-medium">{wallet.name}</span>
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                      {label}
                      {archived && <Badge variant="secondary">Archived</Badge>}
                    </span>
                  </span>
                </span>
                <span className="text-xl font-semibold tabular-nums">
                  {formatMoney(wallet.balance)}
                </span>
              </CollapsibleTrigger>

              <WalletActions wallet={wallet} onEdit={onEdit} onArchive={onArchive} />
            </div>

            {/* Height animates between 0 and the content's; the padding lives
                on the inner div so the panel can close to 0. */}
            <CollapsibleContent className="h-(--collapsible-panel-height) overflow-hidden transition-[height] duration-200 ease-out data-ending-style:h-0 data-starting-style:h-0 motion-reduce:transition-none">
              <div className="px-4 pb-4">
                <BreakdownList
                  items={breakdowns.get(wallet.id) ?? []}
                  empty="Nothing in this wallet yet."
                />
              </div>
            </CollapsibleContent>
          </Collapsible>
        )
      })}
    </ul>
  )
}
