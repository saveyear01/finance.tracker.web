import { useState } from 'react'
import { ChartPie } from 'lucide-react'

import { AddCard } from '@/components/add-card'
import { EmptyState } from '@/components/layouts/empty-state'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AllocationBanner } from '@/features/allocations'
import { FundDrawer, FundRows, useFunds, type Fund } from '@/features/funds'
import { getApiErrorMessage } from '@/lib/api-client'
import { formatMoney } from '@/lib/money'

const FROM = '/funds?tab=allocations'
const sumOf = (funds: Fund[]) =>
  funds.reduce((sum, fund) => sum + Math.round(Number(fund.balance) * 100), 0) / 100

/**
 * The Funds page's Allocations tab: what the money is for. (In code and the
 * API these are still "funds"; the UI has called them allocations since
 * 2026-09-11.)
 *
 * In two sections (2026-11-11), replacing a "Not in total" badge on most
 * rows: **Counted on Home** — the allocations in Home's balance — and **Set
 * aside**, the ones left out. Each row opens the allocation's own page, where
 * that switch, Rename and Archive live. Archived ones are a link under both.
 */
export function AllocationsTab() {
  const [showArchived, setShowArchived] = useState(false)
  const [adding, setAdding] = useState(false)
  const { funds, isLoading, isError, error } = useFunds({ includeArchived: true })
  const active = funds.filter((fund) => fund.archived_at === null)
  const counted = active.filter((fund) => fund.in_total)
  const aside = active.filter((fund) => !fund.in_total)
  const archived = funds.filter((fund) => fund.archived_at !== null)

  return (
    <div className="space-y-3">
      {isError && (
        <Alert variant="destructive">
          <AlertDescription>{getApiErrorMessage(error, 'Could not load your allocations.')}</AlertDescription>
        </Alert>
      )}

      {/* Composed here, not inside the funds feature: the income split
          already depends on funds, and the reverse would be a cycle. */}
      <AllocationBanner from={FROM} />

      <AddCard label="Add new allocation" onClick={() => setAdding(true)} />

      {isLoading ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : active.length === 0 ? (
        <EmptyState
          icon={ChartPie}
          title="No allocations yet"
          description="Add what your money is for — Savings, Emergency Fund, Travel. Money you add to a wallet waits in Unallocated until you split it."
        />
      ) : (
        <>
          {[
            { title: 'Counted on Home', items: counted },
            { title: 'Set aside', items: aside },
          ]
            .filter((group) => group.items.length > 0)
            .map((group) => (
              <section key={group.title} className="space-y-2">
                <h2 className="flex items-baseline justify-between gap-3 px-0.5">
                  <span className="text-sm font-semibold">
                    {group.title} · {group.items.length}
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {formatMoney(sumOf(group.items))}
                  </span>
                </h2>
                <FundRows funds={group.items} from={FROM} />
              </section>
            ))}
        </>
      )}

      {archived.length > 0 &&
        (showArchived ? (
          <section className="space-y-2 pt-2">
            <h2 className="px-0.5 text-sm font-semibold text-muted-foreground">Archived · {archived.length}</h2>
            <FundRows funds={archived} from={FROM} />
          </section>
        ) : (
          <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => setShowArchived(true)}>
            Show {archived.length} archived
          </Button>
        ))}

      <FundDrawer open={adding} fund={null} onOpenChange={setAdding} />
    </div>
  )
}
