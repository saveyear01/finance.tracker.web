import { useSearchParams } from 'react-router-dom'

import { rangeFromParams, rangeParams, type SpendingRange } from '../lib/ranges'

/**
 * The range the spending pages read, held in the URL (see `rangeFromParams`).
 * Other params on the page — the note — are kept when it changes, and the
 * history entry is replaced: picking a range isn't navigating.
 */
export function useSpendingRange(): [SpendingRange, (range: SpendingRange) => void] {
  const [params, setParams] = useSearchParams()
  const range = rangeFromParams(params)

  const setRange = (next: SpendingRange) => {
    const kept = new URLSearchParams(params)
    for (const key of ['range', 'from', 'to']) kept.delete(key)
    for (const [key, value] of Object.entries(rangeParams(next))) kept.set(key, value)
    setParams(kept, { replace: true })
  }

  return [range, setRange]
}
