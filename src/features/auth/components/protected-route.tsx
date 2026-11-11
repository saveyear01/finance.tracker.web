import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { SplashScreen } from '@/components/splash-screen'

import { useCurrentUser } from '../hooks/use-current-user'

/**
 * Gate for routes that require a session. The check is a real request to
 * `/users/me/` — there is no client-readable token to inspect, since the API
 * keeps the JWTs in HTTP-only cookies.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useCurrentUser()
  const location = useLocation()

  // The launch screen carries on until the session is known, so opening the
  // app goes straight from the phone's splash to the first page.
  if (isLoading) return <SplashScreen label="Checking your session…" />

  if (!isAuthenticated) {
    return (
      <Navigate to="/login" replace state={{ from: location.pathname }} />
    )
  }

  return <>{children}</>
}
