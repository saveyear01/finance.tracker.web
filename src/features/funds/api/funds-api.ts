import { apiClient, unwrap } from '@/lib/api-client'

import type { CreateFundInput, Fund, UpdateFundInput } from '../types'

/**
 * `GET /api/funds/` — the caller's funds, Unallocated first, each with its
 * balance and the wallets holding it.
 */
export function listFunds(includeArchived = false): Promise<Fund[]> {
  return unwrap(
    apiClient.get<Fund[]>('/funds/', {
      params: includeArchived ? { include_archived: true } : undefined,
    }),
  )
}

/** `POST /api/funds/` — an empty fund. 409 for a taken or reserved name. */
export function createFund(input: CreateFundInput): Promise<Fund> {
  return unwrap(apiClient.post<Fund>('/funds/', input))
}

/** `PUT /api/funds/{id}/` — rename. Refused for Unallocated. */
export function updateFund({ id, ...input }: UpdateFundInput): Promise<Fund> {
  return unwrap(apiClient.put<Fund>(`/funds/${id}/`, input))
}

/**
 * `DELETE /api/funds/{id}/` — archives, never hard-deletes. 409
 * `fund_has_balance` while it holds money; always 409 for Unallocated.
 */
export async function archiveFund(id: string): Promise<void> {
  await apiClient.delete(`/funds/${id}/`)
}

/** `POST /api/funds/{id}/restore/` — 409 if an active fund took its name. */
export function restoreFund(id: string): Promise<Fund> {
  return unwrap(apiClient.post<Fund>(`/funds/${id}/restore/`))
}
