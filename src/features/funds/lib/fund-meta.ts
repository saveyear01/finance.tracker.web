import type { Fund } from '../types'

/**
 * Why a fund cannot be archived right now, or null if it can. Mirrors the
 * API's rules so the UI never offers an action that always fails — the API
 * remains the authority. Unallocated gets no menu at all, so it has no reason.
 */
export function archiveBlockedReason(fund: Fund): string | null {
  if (fund.allocation_percentage !== null) {
    return 'In your income split'
  }
  if (Number(fund.balance) !== 0) {
    return 'Only empty allocations'
  }
  return null
}

export function canArchive(fund: Fund): boolean {
  return !fund.is_unallocated && archiveBlockedReason(fund) === null
}

/** One line under a fund's name saying where its money is. */
export function holdingsSummary(fund: Fund): string {
  if (fund.is_unallocated) {
    return 'Not assigned to an allocation yet'
  }
  const count = fund.holdings.length
  const where = count === 0 ? 'Empty' : `In ${count} ${count === 1 ? 'wallet' : 'wallets'}`
  return fund.allocation_percentage === null
    ? where
    : `${where} · ${fund.allocation_percentage}% of income`
}
