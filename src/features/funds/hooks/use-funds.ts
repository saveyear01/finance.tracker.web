import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { listFunds } from '../api/funds-api'
import { fundKeys } from '../api/funds-keys'

export function useFunds({ includeArchived = false } = {}) {
  const query = useQuery({
    queryKey: fundKeys.list(includeArchived),
    queryFn: () => listFunds(includeArchived),
    // Toggling "show archived" is a different key; keep the current list on
    // screen while the other loads, rather than flashing a skeleton.
    placeholderData: keepPreviousData,
  })

  return {
    ...query,
    funds: query.data ?? [],
  }
}
