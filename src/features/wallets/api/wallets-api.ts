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

/** PNG, JPG or SVG up to 256 KB — the API checks again, from the bytes. */
export const LOGO_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml']
export const LOGO_MAX_BYTES = 256 * 1024

/** `PUT /api/wallets/{id}/logo/` — add or replace the wallet's logo. */
export function uploadWalletLogo({ id, file }: { id: string; file: File }): Promise<Wallet> {
  const form = new FormData()
  form.append('file', file)
  // No Content-Type of our own: the browser sets multipart with its boundary.
  return unwrap(
    apiClient.put<Wallet>(`/wallets/${id}/logo/`, form, {
      headers: { 'Content-Type': undefined },
    }),
  )
}

/** `DELETE /api/wallets/{id}/logo/` — back to the type's icon. */
export function removeWalletLogo(id: string): Promise<Wallet> {
  return unwrap(apiClient.delete<Wallet>(`/wallets/${id}/logo/`))
}

/**
 * The logo as a data URL, fetched like every other API call (credentials
 * included). Not a plain `<img src>` at the API: where the API is another
 * site, a browser may withhold its cookies from an image request.
 */
export async function fetchWalletLogo(url: string): Promise<string> {
  const response = await apiClient.get<Blob>(url, { responseType: 'blob' })
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(response.data)
  })
}
