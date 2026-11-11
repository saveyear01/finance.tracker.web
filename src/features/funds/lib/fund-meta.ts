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
