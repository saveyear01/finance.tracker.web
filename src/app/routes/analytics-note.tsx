import { useSearchParams } from 'react-router-dom'

import { NoteSpending } from '@/features/spending'

/**
 * One note's spending, day by day. The note is in the query (`?note=`), not
 * the path: it is free text, and the expenses with no note at all — no
 * `note` param — are a group of their own.
 */
export function AnalyticsNoteRoute() {
  const [params] = useSearchParams()

  return (
    <div className="mx-auto w-full max-w-xl">
      <NoteSpending note={params.get('note')} />
    </div>
  )
}
