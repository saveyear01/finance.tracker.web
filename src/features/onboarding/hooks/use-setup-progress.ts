import { useAllocation } from '@/features/allocations'
import { useEverRecorded } from '@/features/analytics'
import { useFunds } from '@/features/funds'
import { useWallets } from '@/features/wallets'

export type SetupStep = 'wallet' | 'allocations' | 'split' | 'income'

/**
 * How far a household is through getting set up — Home's checklist
 * (design/large-screen.html, "First run"). Each step is read off data the app
 * already has, never stored, so it ticks the moment the thing exists and
 * un-ticks if it stops existing (the last wallet archived, the split
 * cleared):
 *
 * 1. a wallet — any active one;
 * 2. what money is for — any active allocation besides Unallocated;
 * 3. the income split — any rules at all (a set always totals 100%);
 * 4. a first income — ever, by this year's income summary plus the newest
 *    day before it (`useEverRecorded`). That counts income and its split
 *    legs only, so a wallet's opening balance, an adjustment, doesn't tick
 *    it.
 *
 * `ready` is false until every answer is in, so a household long set up never
 * sees the card flash before its data arrives.
 */
export function useSetupProgress() {
  const wallets = useWallets()
  const funds = useFunds()
  const allocation = useAllocation()
  const hasIncome = useEverRecorded('income')

  const purposes = funds.funds.filter((fund) => !fund.is_unallocated)
  const done: Record<SetupStep, boolean> = {
    wallet: wallets.wallets.length > 0,
    allocations: purposes.length > 0,
    split: allocation.rules.length > 0,
    income: hasIncome === true,
  }
  const doneCount = Object.values(done).filter(Boolean).length
  const complete = doneCount === 4

  // Only worth asking while the card shows: whether anything at all has been
  // spent, so Home can drop the month so far while there's nothing for it.
  const hasExpense = useEverRecorded('expense', !complete)

  return {
    ready: wallets.isSuccess && funds.isSuccess && allocation.isSuccess && hasIncome !== null,
    done,
    doneCount,
    complete,
    /** Nothing recorded yet — no income, no expense, ever. */
    nothingRecorded: hasIncome === false && hasExpense === false,
    wallets: wallets.wallets,
    purposes,
    rules: allocation.rules,
  }
}

export type SetupProgress = ReturnType<typeof useSetupProgress>
