import { useSearchParams } from 'react-router-dom'

import { kindFromParams } from '../lib/kinds'
import type { Kind } from '../types'

/**
 * The tab — expenses (the default) or `?tab=income`. In the URL like the
 * range and the view, so a note's page and its back button land on the same
 * tab; switching keeps the range and replaces the history entry.
 */
export function useAnalyticsKind(): [Kind, (kind: Kind) => void] {
  const [params, setParams] = useSearchParams()
  const kind = kindFromParams(params)

  const setKind = (next: Kind) => {
    const kept = new URLSearchParams(params)
    if (next === 'expense') kept.delete('tab')
    else kept.set('tab', next)
    setParams(kept, { replace: true })
  }

  return [kind, setKind]
}
