import { useSearchParams } from 'react-router-dom'

import { RANGE_PARAM_KEYS, rangeFromParams, rangeParams, type AnalyticsRange } from '../lib/ranges'

/**
 * The period the Analytics pages read, held in the URL (see `rangeFromParams`).
 * Other params on the page — the tab, the note — are kept when it changes, and
 * the history entry is replaced: stepping through months isn't navigating.
 */
export function useAnalyticsRange(): [AnalyticsRange, (range: AnalyticsRange) => void] {
  const [params, setParams] = useSearchParams()
  const range = rangeFromParams(params)

  const setRange = (next: AnalyticsRange) => {
    const kept = new URLSearchParams(params)
    for (const key of RANGE_PARAM_KEYS) kept.delete(key)
    for (const [key, value] of Object.entries(rangeParams(next))) kept.set(key, value)
    setParams(kept, { replace: true })
  }

  return [range, setRange]
}
