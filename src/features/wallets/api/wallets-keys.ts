/** Query-key factory for everything the wallets feature caches. */
export const walletKeys = {
  all: ['wallets'] as const,
  list: (includeArchived: boolean) =>
    [...walletKeys.all, 'list', { includeArchived }] as const,
}
