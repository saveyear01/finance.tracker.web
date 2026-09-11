import { apiClient, unwrap } from '@/lib/api-client'

import type { CreateWalletInput, UpdateWalletInput, Wallet } from '../types'

/** `GET /api/wallets/` — the caller's wallets, oldest first, with balances. */
export function listWallets(includeArchived = false): Promise<Wallet[]> {
  return unwrap(
    apiClient.get<Wallet[]>('/wallets/', {
      params: includeArchived ? { include_archived: true } : undefined,
    }),
  )
}

/**
 * `POST /api/wallets/` — any opening balance is posted server-side as a manual
 * adjustment into Unallocated, in the same commit as the wallet.
 */
export function createWallet(input: CreateWalletInput): Promise<Wallet> {
  return unwrap(apiClient.post<Wallet>('/wallets/', input))
}

/** `PUT /api/wallets/{id}/` — name and type only. */
export function updateWallet({ id, ...input }: UpdateWalletInput): Promise<Wallet> {
  return unwrap(apiClient.put<Wallet>(`/wallets/${id}/`, input))
}

/**
 * `DELETE /api/wallets/{id}/` — archives, never hard-deletes. Refused with 409
 * `wallet_has_balance` while the wallet holds money.
 */
export async function archiveWallet(id: string): Promise<void> {
  await apiClient.delete(`/wallets/${id}/`)
}

/** `POST /api/wallets/{id}/restore/` — 409 if an active wallet took its name. */
export function restoreWallet(id: string): Promise<Wallet> {
  return unwrap(apiClient.post<Wallet>(`/wallets/${id}/restore/`))
}
