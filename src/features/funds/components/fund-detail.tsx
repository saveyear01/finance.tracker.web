import type { ReactNode } from 'react'
import { Archive, ArchiveRestore, ChartPie, Inbox, Pencil } from 'lucide-react'
import { toast } from 'sonner'

import { BreakdownList } from '@/components/breakdown-list'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { getApiErrorMessage } from '@/lib/api-client'
import { formatMoney } from '@/lib/money'

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
 */
export function FundDetail({
  id,
  onEdit,
  onArchive,
  activity,
}: {
  id: string | undefined
  onEdit: (fund: Fund) => void
  onArchive: (fund: Fund) => void
  activity: ReactNode
}) {
  const { funds, isLoading, isError, error } = useFunds({ includeArchived: true })
  const setInTotal = useSetFundInTotal()
  const restore = useRestoreFund()

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

  return (
    <div className="space-y-4">
      <section className="rounded-xl bg-secondary px-5 py-4 text-secondary-foreground">
        <p className="flex items-center gap-2.5 text-sm text-secondary-foreground/90">
          <span className="grid size-8 place-items-center rounded-full bg-secondary-foreground/15" aria-hidden="true">
            <Icon className="size-4" />
          </span>
          <span className="truncate font-medium">{fund.name}</span>
          {archived && (
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
          }))}
          empty="No wallet holds any of it."
        />
      </section>

      {!archived && (
        <label className="flex cursor-pointer items-center justify-between gap-4 card-surface p-4 text-card-foreground">
          <span className="min-w-0">
            <span className="block text-sm font-semibold">Count in Home's total</span>
            <span className="block text-xs text-muted-foreground">
              {fund.in_total
                ? 'On: part of what reads as spendable.'
                : 'Off: kept out of what reads as spendable.'}
            </span>
          </span>
          <Switch checked={fund.in_total} onCheckedChange={toggle} disabled={setInTotal.isPending} />
        </label>
      )}

      {archived ? (
        <Button
          variant="outline"
          className="h-11 w-full"
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
      ) : (
        !fund.is_unallocated && (
          <div className="space-y-1.5">
            <div className="flex gap-2">
              <Button variant="outline" className="h-11 flex-1" onClick={() => onEdit(fund)}>
                <Pencil />
                Rename
              </Button>
              <Button
                variant="outline"
                className="h-11 flex-1 text-destructive"
                disabled={!canArchive(fund)}
                onClick={() => onArchive(fund)}
              >
                <Archive />
                Archive
              </Button>
            </div>
            {blocked && (
              <p className="text-right text-xs text-muted-foreground">Archive: {blocked.toLowerCase()}.</p>
            )}
          </div>
        )
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Activity</h2>
        {activity}
      </section>
    </div>
  )
}
