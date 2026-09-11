import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { fundKeys } from '@/features/funds'

import { getAllocation, saveAllocation } from '../api/allocations-api'
import { allocationKeys } from '../api/allocations-keys'

export function useAllocation() {
  const query = useQuery({
    queryKey: allocationKeys.current(),
    queryFn: getAllocation,
  })

  return {
    ...query,
    rules: query.data?.rules ?? [],
  }
}

/**
 * Save the whole allocation. The response is the saved set, written straight
 * into the cache. The funds lists go stale too — each fund reports its share
 * (and whether it can be archived), so they are invalidated.
 *
 * The dependency runs one way: allocations use `fundKeys` and the funds list;
 * funds import nothing from allocations. No barrel cycle.
 */
export function useSaveAllocation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: saveAllocation,
    onSuccess: (allocation) => {
      queryClient.setQueryData(allocationKeys.current(), allocation)
      return queryClient.invalidateQueries({ queryKey: fundKeys.all })
    },
  })
}
