import { apiClient, unwrap } from '@/lib/api-client'

import type { Allocation, AllocationWrite } from '../types'

/** `GET /api/allocation-rules/` — the caller's rules, in their order. */
export function getAllocation(): Promise<Allocation> {
  return unwrap(apiClient.get<Allocation>('/allocation-rules/'))
}

/**
 * `PUT /api/allocation-rules/` — replace the whole set. 422 unless it totals
 * exactly 100% (or is empty, which clears the allocation).
 */
export function saveAllocation(allocation: AllocationWrite): Promise<Allocation> {
  return unwrap(apiClient.put<Allocation>('/allocation-rules/', allocation))
}
