/** Query-key factory for everything the wallets feature caches. */
export const walletKeys = {
  all: ['wallets'] as const,
  list: (includeArchived: boolean) =>
    [...walletKeys.all, 'list', { includeArchived }] as const,
}

/**
 * A logo image, by its versioned URL. Its own root, not under `wallets`:
 * every money change invalidates the wallets, and that must not refetch
 * images that can't have changed (a new logo is a new URL).
 */
export const walletLogoKeys = {
  image: (url: string) => ['wallet-logo', url] as const,
}
