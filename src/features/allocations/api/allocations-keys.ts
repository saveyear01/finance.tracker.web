/** Query-key factory for everything the allocations feature caches. */
export const allocationKeys = {
  all: ['allocation'] as const,
  current: () => [...allocationKeys.all, 'current'] as const,
}
