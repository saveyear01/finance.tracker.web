import { useQuery } from '@tanstack/react-query'

import { fetchWalletLogo } from '../api/wallets-api'
import { walletLogoKeys } from '../api/wallets-keys'

/**
 * A wallet's logo as a data URL, or undefined while it loads or when there
 * is none. Kept for good: the URL is versioned, so a cached image can never
 * be out of date — a new logo arrives as a new URL.
 */
export function useWalletLogo(url: string | null | undefined): string | undefined {
  const { data } = useQuery({
    queryKey: walletLogoKeys.image(url ?? ''),
    queryFn: () => fetchWalletLogo(url as string),
    enabled: Boolean(url),
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 1,
  })
  return url ? data : undefined
}
