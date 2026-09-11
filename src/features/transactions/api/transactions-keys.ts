/** Query-key factory for everything the transactions feature caches. */
export const transactionKeys = {
  all: ['transactions'] as const,
  recent: (limit: number) => [...transactionKeys.all, 'recent', { limit }] as const,
  pages: (pageSize: number) => [...transactionKeys.all, 'pages', { pageSize }] as const,
  group: (groupId: string) => [...transactionKeys.all, 'group', groupId] as const,
}
