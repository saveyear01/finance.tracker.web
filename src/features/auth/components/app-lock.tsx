import { useEffect, type ReactNode } from 'react'

import { useCurrentUser } from '../hooks/use-current-user'
import { AWAY_LIMIT_MS, appLock, useAppLocked } from '../lib/app-lock'
import { LockScreen } from './lock-screen'

/**
 * The PIN gate around the signed-in app — only for accounts with a PIN.
 *
 * Locked when the app is opened (the lock state lives in memory, so a launch
 * or reload starts locked) and again after five minutes away: the moment the
 * page is hidden is noted, and coming back later than that locks it. Quick
 * switches don't. Signing in with the password, or setting a PIN, unlocks.
 *
 * While locked the app itself isn't rendered at all — so nothing of it shows,
 * and none of its data is fetched, behind the lock screen.
 *
 * It locks the screens, not the API: the session cookies stay valid, which
 * is what lets the PIN unlock without a password.
 */
export function AppLock({ children }: { children: ReactNode }) {
  const { user } = useCurrentUser()
  const locked = useAppLocked()

  useEffect(() => {
    let hiddenAt: number | null = null
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAt = Date.now()
      } else if (hiddenAt !== null && Date.now() - hiddenAt >= AWAY_LIMIT_MS) {
        appLock.lock()
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  if (user?.has_pin && locked) return <LockScreen user={user} />
  return <>{children}</>
}
