import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

import { NO_FILTERS, filtersFromParams, paramsOf, type ListFilters } from '../lib/list-filters'

/**
 * The Transactions page's filters, kept in the URL so they survive a reload
 * and Back returns to them. A change REPLACES the history entry rather than
 * adding one — narrowing a list isn't navigating, and a search typed letter
 * by letter would otherwise leave a Back step per pause.
 */
export function useListFilters() {
  const [params, setParams] = useSearchParams()
  const filters = useMemo(() => filtersFromParams(params), [params])

  const update = useCallback(
    (change: Partial<ListFilters>) =>
      setParams((current) => paramsOf({ ...filtersFromParams(current), ...change }), {
        replace: true,
      }),
    [setParams],
  )
  const clear = useCallback(() => update(NO_FILTERS), [update])

  return { filters, update, clear }
}
