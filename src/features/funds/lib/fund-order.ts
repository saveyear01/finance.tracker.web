import type { Fund } from '../types'

/**
 * The Allocations tab's rows in the order it shows them: "Counted on Home",
 * then "Set aside", then the archived ones behind "Show N archived". One
 * place, so the list and the big screen's "open the first row" never
 * disagree.
 *
 * Unallocated only once it holds something (or is borrowed against): an
 * empty one is just noise above the allocations the user made.
 */
export function allocationGroups(funds: Fund[]) {
  const active = funds.filter(
    (fund) => fund.archived_at === null && !(fund.is_unallocated && Number(fund.balance) === 0),
  )
  return {
    active,
    counted: active.filter((fund) => fund.in_total),
    aside: active.filter((fund) => !fund.in_total),
    archived: funds.filter((fund) => fund.archived_at !== null),
  }
}
