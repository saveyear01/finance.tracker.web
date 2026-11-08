import { useSearchParams } from 'react-router-dom'

export type AnalyticsView = 'pie' | 'list'

/**
 * Which way the overview shows the notes — the pie by default, `?view=list`
 * for the rows with bars. In the URL like the range, so opening a note and
 * coming back keeps it; switching replaces the history entry.
 */
export function useAnalyticsView(): [AnalyticsView, (view: AnalyticsView) => void] {
  const [params, setParams] = useSearchParams()
  const view: AnalyticsView = params.get('view') === 'list' ? 'list' : 'pie'

  const setView = (next: AnalyticsView) => {
    const kept = new URLSearchParams(params)
    if (next === 'pie') kept.delete('view')
    else kept.set('view', next)
    setParams(kept, { replace: true })
  }

  return [view, setView]
}
