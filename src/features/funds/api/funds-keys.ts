/** Query-key factory for everything the funds feature caches. */
export const fundKeys = {
  all: ['funds'] as const,
  list: (includeArchived: boolean) => [...fundKeys.all, 'list', { includeArchived }] as const,
}
