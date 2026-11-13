import type { NavBadge } from '@/config/navigation'
import { useDebtsBehind } from '@/features/debts'
import { useFunds } from '@/features/funds'
import { useDueNow } from '@/features/upcoming'

/**
 * The nav's live counts: bills overdue, debts behind their schedule, and
 * allocations below zero. Each reads a query its own page already makes, so
 * the nav adds no request of its own once those are cached.
 */
export function useNavBadges(): Record<NavBadge, number> {
  const { overdue } = useDueNow()
  const behind = useDebtsBehind()
  const { funds } = useFunds()
  const overdrawn = funds.filter((fund) => !fund.archived_at && Number(fund.balance) < 0).length
  return { overdue, behind, overdrawn }
}
