import { useMemo, type ReactNode } from 'react'
import { Archive, ArchiveRestore, Pencil } from 'lucide-react'
import { toast } from 'sonner'

import { BreakdownList } from '@/components/breakdown-list'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { fundColors, useFunds } from '@/features/funds'
import { useIsCompact } from '@/hooks/use-compact'
import { getApiErrorMessage } from '@/lib/api-client'
import { formatMoney } from '@/lib/money'
import { cn } from '@/lib/utils'

import { useWalletBreakdowns } from '../hooks/use-wallet-breakdowns'
import { useRestoreWallet } from '../hooks/use-mutate-wallet'
import { useWallets } from '../hooks/use-wallets'
import { canArchive, WALLET_TYPE_META } from '../lib/wallet-meta'
import { WalletAvatar } from './wallet-avatar'
import type { Wallet } from '../types'

/**
 * One wallet's page (added 2026-11-11 — before, a wallet had a card that
 * opened on an unmarked tap, a ⋮ menu, and no history of its own): the
 * balance in the dark hero with the quick actions (`actions`, which open
 * with this wallet picked), what it holds by allocation in each one's
 * colour, Edit / Archive, then its own entries (`activity`) — last, since that list
 * can run long and would bury the buttons.
 *
 * `actions` and `activity` are composed by the route: recording and the
 * ledger live in transactions, which already depends on wallets.
 *
 * An archived wallet can only be restored. Archive stays visible but
 * disabled while the wallet holds anything, with the reason.
 *
 * From `lg` it is the right-hand pane beside the Funds list, laid out wider:
 * the name with Edit / Archive as a header, then the hero and the split side
 * by side. Below `lg`, one column as before.
 */
export function WalletDetail({
  id,
  onEdit,
  onArchive,
  actions,
  activity,
}: {
  id: string | undefined
  onEdit: (wallet: Wallet) => void
  onArchive: (wallet: Wallet) => void
  actions: ReactNode
  activity: ReactNode
}) {
  const { wallets, isLoading, isError, error } = useWallets({ includeArchived: true })
  const breakdowns = useWalletBreakdowns()
  const { funds } = useFunds()
  const colors = useMemo(() => fundColors(funds), [funds])
  const restore = useRestoreWallet()
  const compact = useIsCompact()

  if (isLoading) {
    return (
      <div className="space-y-4" aria-hidden="true">
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    )
  }
  const wallet = wallets.find((candidate) => candidate.id === id)
  if (isError || !wallet) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{isError ? getApiErrorMessage(error) : "That wallet doesn't exist."}</AlertDescription>
      </Alert>
    )
  }

  const { label } = WALLET_TYPE_META[wallet.type]
  const archived = wallet.archived_at !== null
  const items = (breakdowns.get(wallet.id) ?? []).map((item) => ({ ...item, color: colors.get(item.id) }))
  const holding = items.filter((item) => Number(item.amount) !== 0).length
  const formatted = formatMoney(wallet.balance)
  const point = formatted.lastIndexOf('.')
  const [whole, cents] = point === -1 ? [formatted, ''] : [formatted.slice(0, point), formatted.slice(point)]

  const restoreButton = (className: string) => (
    <Button
      variant="outline"
      className={className}
      disabled={restore.isPending}
      onClick={() =>
        restore.mutate(wallet.id, {
          onSuccess: () => toast.success(`${wallet.name} restored.`),
          onError: (err) => toast.error(getApiErrorMessage(err)),
        })
      }
    >
      <ArchiveRestore />
      Restore
    </Button>
  )
  const editButton = (className?: string) => (
    <Button variant="outline" className={className} onClick={() => onEdit(wallet)}>
      <Pencil />
      Edit
    </Button>
  )
  const archiveButton = (className?: string) => (
    <Button
      variant="outline"
      className={cn('text-destructive', className)}
      disabled={!canArchive(wallet)}
      onClick={() => onArchive(wallet)}
    >
      <Archive />
      Archive
    </Button>
  )
  const archiveReason = !canArchive(wallet) && (
    <p className="text-right text-xs text-muted-foreground">Archive: only an empty wallet.</p>
  )

  const hero = (
    <section className="rounded-xl bg-secondary px-5 pt-4 pb-5 text-secondary-foreground">
      <p className="flex items-center gap-2.5 text-sm text-secondary-foreground/90">
        <WalletAvatar wallet={wallet} size="sm" tone="hero" className="size-8" />
        {/* On a big screen the name heads the pane, so the card needn't repeat it. */}
        <span className="truncate font-medium">{compact ? `${wallet.name} · ${label}` : 'In this wallet'}</span>
        {compact && archived && (
          <span className="rounded-full bg-secondary-foreground/15 px-2 py-0.5 text-xs">Archived</span>
        )}
      </p>
      <p className="mt-3 figure-xl">
        {whole}
        <span className="text-secondary-foreground/50">{cents}</span>
      </p>
      <p className="mt-1 text-xs text-secondary-foreground/75">
        {holding === 0 ? 'Empty' : `Holds ${holding} ${holding === 1 ? 'allocation' : 'allocations'}`}
      </p>
      {!archived && <div className="mt-5">{actions}</div>}
    </section>
  )

  const split = (
    <section className="space-y-3 card-surface p-4 text-card-foreground">
      <h2 className="flex items-baseline justify-between gap-2 text-sm font-semibold">
        What it holds
        <span className="text-xs font-normal text-muted-foreground">by allocation</span>
      </h2>
      <BreakdownList items={items} empty="Nothing in this wallet yet." />
    </section>
  )

  const activitySection = (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold">Activity</h2>
      {activity}
    </section>
  )

  if (!compact) {
    // A big screen (design/large-screen.html, "Funds"): the name and its
    // buttons head the pane, the hero and the split share a row, and the
    // activity runs below at full width.
    return (
      <div className="space-y-4">
        <header className="flex items-start justify-between gap-4">
          <h2 className="flex min-w-0 items-center gap-2 pt-1 text-lg font-semibold">
            <WalletAvatar wallet={wallet} size="sm" />
            <span className="truncate">{wallet.name}</span>
            <Badge variant="secondary">{label}</Badge>
            {archived && <Badge variant="outline">Archived</Badge>}
          </h2>
          <div className="shrink-0 space-y-1">
            <div className="flex justify-end gap-2">
              {archived ? (
                restoreButton('')
              ) : (
                <>
                  {editButton()}
                  {archiveButton()}
                </>
              )}
            </div>
            {!archived && archiveReason}
          </div>
        </header>
        <div className="grid grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-4">
          {hero}
          {split}
        </div>
        {activitySection}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {hero}
      {split}

      {archived ? (
        restoreButton('h-11 w-full')
      ) : (
        <div className="space-y-1.5">
          <div className="flex gap-2">
            {editButton('h-11 flex-1')}
            {archiveButton('h-11 flex-1')}
          </div>
          {archiveReason}
        </div>
      )}

      {activitySection}
    </div>
  )
}
