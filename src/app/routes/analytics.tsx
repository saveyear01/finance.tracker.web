import { AnalyticsOverview } from '@/features/analytics'

/**
 * Analytics: the window's expenses or income grouped by note, as a pie or a
 * list, a note opening its own page. Reached from the nav only.
 */
export function AnalyticsRoute() {
  return (
    <div className="mx-auto w-full max-w-xl lg:max-w-310">
      <AnalyticsOverview />
    </div>
  )
}
