import { Navigate } from 'react-router-dom'

import { ProfileCard, ProfileMenu } from '@/features/profile'
import { useIsCompact } from '@/hooks/use-compact'

/**
 * The profile menu. From `lg` the menu sits beside whichever page is open
 * (`ProfileLayout`), so this page on its own would only repeat it: it opens
 * Profile settings instead, replacing the entry so Back doesn't land here.
 */
export function ProfileRoute() {
  const compact = useIsCompact()
  if (!compact) return <Navigate to="/profile/settings" replace />

  return (
    <div className="mx-auto w-full max-w-xl space-y-4">
      <ProfileCard />
      <ProfileMenu />
    </div>
  )
}
