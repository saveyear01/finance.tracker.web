import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { SplashScreen } from '@/components/splash-screen'
import { bootIsShowing } from '@/lib/boot'

import { useCurrentUser } from '../hooks/use-current-user'

/**
 * Gate for routes that require a session. The check is a real request to
 * `/users/me/` — there is no client-readable token to inspect, since the API
 * keeps the JWTs in HTTP-only cookies.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useCurrentUser()
  const location = useLocation()

  // On launch the animated launch screen (#boot) is still covering this, and
  // plays out once the session is known. A later check — after the launch
  // screen has gone — gets the still version of it.
  if (isLoading) return bootIsShowing() ? null : <SplashScreen label="Checking your session…" />

  if (!isAuthenticated) {
    return (
      <Navigate to="/login" replace state={{ from: location.pathname }} />
    )
  }

  return <>{children}</>
}
