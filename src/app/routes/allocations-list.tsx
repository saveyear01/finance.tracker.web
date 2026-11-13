import { useState } from 'react'
import { ChartPie, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

import { AddCard } from '@/components/add-card'
import { EmptyState } from '@/components/layouts/empty-state'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AllocationBanner } from '@/features/allocations'
import { allocationGroups, FundDrawer, FundRows, useFunds, type Fund } from '@/features/funds'
import { useIsCompact } from '@/hooks/use-compact'
import { getApiErrorMessage } from '@/lib/api-client'

const FROM = '/allocations'
const centsOf = (funds: Fund[]) => funds.reduce((sum, fund) => sum + Math.round(Number(fund.balance) * 100), 0)

/**
 * The Allocations list: what the money is for. (In code and the API these
 * are still "funds"; the UI has called them allocations since 2026-09-11.)
 * A page of its own since 2026-11-13 — it was a tab of Funds, beside
 * Wallets. On a phone it is the /allocations page, reached from the Wallets
 * page's link (the pill's Wallets item stands for both); on a big screen it
 * is also the left pane beside an open allocation (`selectedId`).
 *
 * In two sections (2026-11-11), replacing a "Not in total" badge on most
 * rows: **Counted on Home** — the allocations in Home's balance — and **Set
 * aside**, the ones left out. Each row opens the allocation's own page, where
 * that switch, Rename and Archive live. Archived ones are a link under both.
 * An empty Unallocated is left out (`allocationGroups`).
 *
 * `selectedId` is the allocation open beside the list on a big screen. When
 * that one is archived the archived rows show, so the open row is never
 * hidden.
 */
export function AllocationsList({ selectedId }: { selectedId?: string }) {
  const compact = useIsCompact()
  const [expanded, setExpanded] = useState(false)
  const [adding, setAdding] = useState(false)
  const { funds, isLoading, isError, error } = useFunds({ includeArchived: true })
  const { active, counted, aside, archived } = allocationGroups(funds)
  const showArchived = expanded || archived.some((fund) => fund.id === selectedId)

  return (
    <div className="space-y-3">
      {compact && (
        <div className="flex justify-end">
          <Link
            to="/wallets"
            className="inline-flex items-center gap-0.5 rounded-md text-sm font-medium text-primary outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            Wallets
            <ChevronRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      )}

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
                <h2 className="px-0.5 text-sm font-semibold">
                  {group.title} · {group.items.length}
                </h2>
                {/* Each section's sum closes its list, quietly (2026-11-13). */}
                <FundRows funds={group.items} from={FROM} selectedId={selectedId} total={centsOf(group.items)} />
              </section>
            ))}
        </>
      )}

      {archived.length > 0 &&
        (showArchived ? (
          <section className="space-y-2 pt-2">
            <h2 className="px-0.5 text-sm font-semibold text-muted-foreground">Archived · {archived.length}</h2>
            <FundRows funds={archived} from={FROM} selectedId={selectedId} />
          </section>
        ) : (
          <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => setExpanded(true)}>
            Show {archived.length} archived
          </Button>
        ))}

      <FundDrawer open={adding} fund={null} onOpenChange={setAdding} />
    </div>
  )
}
