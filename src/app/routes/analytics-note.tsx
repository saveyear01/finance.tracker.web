import { useSearchParams } from 'react-router-dom'

import { kindFromParams, NoteDays } from '@/features/analytics'

/**
 * One note's expenses or income, day by day. The note is in the query
 * (`?note=`), not the path: it is free text, and the entries with no note at
 * all — no `note` param — are a group of their own. `?tab=income` picks the
 * income side, as on the overview.
 */
export function AnalyticsNoteRoute() {
  const [params] = useSearchParams()

  return (
    <div className="mx-auto w-full max-w-xl">
      <NoteDays kind={kindFromParams(params)} note={params.get('note')} />
    </div>
  )
}
