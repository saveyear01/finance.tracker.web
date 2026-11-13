import type { ReactNode } from 'react'
import { Archive, ArchiveRestore, ChartPie, Inbox, Pencil } from 'lucide-react'
import { toast } from 'sonner'

import { BreakdownList } from '@/components/breakdown-list'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { useIsCompact } from '@/hooks/use-compact'
import { getApiErrorMessage } from '@/lib/api-client'
import { formatMoney } from '@/lib/money'
import { cn } from '@/lib/utils'

import { useFunds } from '../hooks/use-funds'
import { useRestoreFund, useSetFundInTotal } from '../hooks/use-mutate-fund'
import { fundColors } from '../lib/fund-colors'
import { archiveBlockedReason, canArchive } from '../lib/fund-meta'
import type { Fund } from '../types'

/**
 * One allocation's page (added 2026-11-11 — before, an allocation had a card
 * and a ⋮ menu, and its history was only in the whole activity): the balance
 * in the dark hero, where it sits by wallet, "Count in Home's total" as a
 * switch (it was a menu item), Rename / Archive, then its own entries —
 * last, since that list can run long and would bury the buttons.
 *
 * Unallocated has no rename or archive (409 fund_is_system), only the switch.
 * An archived allocation can only be restored. Archive stays visible but
 * disabled while it holds money or is in the income split, with the reason —
 * a rule you can see beats an option that's missing.
 *
 * `activity` is the allocation's entries, composed by the route: the ledger
 * lives in transactions, which already depends on funds.
 *
 * From `lg` it is the right-hand pane beside the Funds list, laid out wider:
 * the name with Rename / Archive as a header, then the hero and the split
 * side by side. Below `lg`, one column as before.
 */
export function FundDetail({
  id,
  onEdit,
  onArchive,
  activity,
  walletIcon,
}: {
  id: string | undefined
  onEdit: (fund: Fund) => void
  onArchive: (fund: Fund) => void
  activity: ReactNode
  /**
   * A wallet's logo for the "Where it sits" rows. Passed in by the route:
   * funds never imports wallets (wallets depends on funds), or the two
   * barrels would form a cycle.
   */
  walletIcon?: (walletId: string) => ReactNode
}) {
  const { funds, isLoading, isError, error } = useFunds({ includeArchived: true })
  const setInTotal = useSetFundInTotal()
  const restore = useRestoreFund()
  const compact = useIsCompact()

  if (isLoading) {
    return (
      <div className="space-y-4" aria-hidden="true">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-28 w-full rounded-xl" />
      </div>
    )
  }
  const fund = funds.find((candidate) => candidate.id === id)
  if (isError || !fund) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {isError ? getApiErrorMessage(error) : "That allocation doesn't exist."}
        </AlertDescription>
      </Alert>
    )
  }

  const archived = fund.archived_at !== null
  const color = fundColors(funds.filter((candidate) => candidate.archived_at === null)).get(fund.id)
  const blocked = archiveBlockedReason(fund)
  const negative = Number(fund.balance) < 0
  const Icon = fund.is_unallocated ? Inbox : ChartPie
  const count = fund.holdings.length
  const meta = [
    count === 0 ? 'Empty' : `In ${count} ${count === 1 ? 'wallet' : 'wallets'}`,
    fund.is_unallocated
      ? 'money with no purpose yet'
      : fund.allocation_percentage !== null
        ? `${fund.allocation_percentage}% of every income`
        : 'not in the income split',
  ].join(' · ')

  const toggle = (checked: boolean) =>
    setInTotal.mutate(
      { id: fund.id, in_total: checked },
      {
        onSuccess: () =>
          toast.success(checked ? `${fund.name} now counts in your total.` : `${fund.name} left out of your total.`),
        onError: (err) => toast.error(getApiErrorMessage(err)),
      },
    )

  const restoreButton = (className: string) => (
    <Button
      variant="outline"
      className={className}
      disabled={restore.isPending}
      onClick={() =>
        restore.mutate(fund.id, {
          onSuccess: () => toast.success(`${fund.name} restored.`),
          onError: (err) => toast.error(getApiErrorMessage(err)),
        })
      }
    >
      <ArchiveRestore />
      Restore
    </Button>
  )
  const renameButton = (className?: string) => (
    <Button variant="outline" className={className} onClick={() => onEdit(fund)}>
      <Pencil />
      Rename
    </Button>
  )
  const archiveButton = (className?: string) => (
    <Button
      variant="outline"
      className={cn('text-destructive', className)}
      disabled={!canArchive(fund)}
      onClick={() => onArchive(fund)}
    >
      <Archive />
      Archive
    </Button>
  )
  const archiveReason = blocked && (
    <p className="text-right text-xs text-muted-foreground">Archive: {blocked.toLowerCase()}.</p>
  )

  const hero = (
    <section className="rounded-xl bg-secondary px-5 py-4 text-secondary-foreground">
      <p className="flex items-center gap-2.5 text-sm text-secondary-foreground/90">
        <span className="grid size-8 place-items-center rounded-full bg-secondary-foreground/15" aria-hidden="true">
          <Icon className="size-4" />
        </span>
        {/* On a big screen the name heads the pane, so the card needn't repeat it. */}
        <span className="truncate font-medium">{compact ? fund.name : 'In this allocation'}</span>
        {compact && archived && (
          <span className="rounded-full bg-secondary-foreground/15 px-2 py-0.5 text-xs">Archived</span>
        )}
      </p>
      {/* No red on the dark card (it fails contrast there): the minus and
          the line under it say it. */}
      <p className="mt-3 figure-xl">
        {negative ? '−' : ''}
        {formatMoney(Math.abs(Number(fund.balance)))}
      </p>
      <p className="mt-1 text-xs text-secondary-foreground/75">{meta}</p>
      {negative && (
        <p className="mt-2 text-xs text-secondary-foreground/90">
          Spent past what it held. Income into it brings it back.
        </p>
      )}
    </section>
  )

  const split = (
    <section className="space-y-3 card-surface p-4 text-card-foreground">
      <h2 className="flex items-baseline justify-between gap-2 text-sm font-semibold">
        Where it sits
        <span className="text-xs font-normal text-muted-foreground">by wallet</span>
      </h2>
      <BreakdownList
        items={fund.holdings.map((holding) => ({
          id: holding.wallet_id,
          label: holding.wallet_name,
          amount: holding.balance,
          color,
          icon: walletIcon?.(holding.wallet_id),
        }))}
        empty="No wallet holds any of it."
      />
    </section>
  )

  const inTotalSwitch = !archived && (
    <label className="flex cursor-pointer items-center justify-between gap-4 card-surface p-4 text-card-foreground">
      <span className="min-w-0">
        <span className="block text-sm font-semibold">Count in Home's total</span>
        <span className="block text-xs text-muted-foreground">
          {fund.in_total ? 'On: part of what reads as spendable.' : 'Off: kept out of what reads as spendable.'}
        </span>
      </span>
      <Switch checked={fund.in_total} onCheckedChange={toggle} disabled={setInTotal.isPending} />
    </label>
  )

  const activitySection = (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold">Activity</h2>
      {activity}
    </section>
  )

  if (!compact) {
    // A big screen (design/large-screen.html, "Funds"): the name and its
    // buttons head the pane, the hero and the split share a row (the
    // in-total switch under the split, beside the hero), and the activity
    // runs below at full width. Unallocated has no buttons to show.
    return (
      <div className="space-y-4">
        <header className="flex items-start justify-between gap-4">
          <h2 className="flex min-w-0 items-center gap-2 pt-1 text-lg font-semibold">
            <span className="truncate">{fund.name}</span>
            {fund.allocation_percentage !== null && (
              <Badge variant="secondary" className="bg-accent text-accent-foreground">
                {fund.allocation_percentage}%<span className="sr-only"> of income</span>
              </Badge>
            )}
            {archived && <Badge variant="outline">Archived</Badge>}
          </h2>
          <div className="shrink-0 space-y-1">
            <div className="flex justify-end gap-2">
              {archived
                ? restoreButton('')
                : !fund.is_unallocated && (
                    <>
                      {renameButton()}
                      {archiveButton()}
                    </>
                  )}
            </div>
            {!archived && !fund.is_unallocated && archiveReason}
          </div>
        </header>
        <div className="grid grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] items-start gap-4">
          {hero}
          <div className="space-y-4">
            {split}
            {inTotalSwitch}
          </div>
        </div>
        {activitySection}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {hero}
      {split}
      {inTotalSwitch}

      {archived ? (
        restoreButton('h-11 w-full')
      ) : (
        !fund.is_unallocated && (
          <div className="space-y-1.5">
            <div className="flex gap-2">
              {renameButton('h-11 flex-1')}
              {archiveButton('h-11 flex-1')}
            </div>
            {archiveReason}
          </div>
        )
      )}

      {activitySection}
    </div>
  )
}
