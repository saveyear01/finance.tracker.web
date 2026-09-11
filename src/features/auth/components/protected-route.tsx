import type { ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { Navigate, useLocation } from 'react-router-dom'

import { useCurrentUser } from '../hooks/use-current-user'

/**
 * Gate for routes that require a session. The check is a real request to
 * `/users/me/` — there is no client-readable token to inspect, since the API
 * keeps the JWTs in HTTP-only cookies.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useCurrentUser()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="grid min-h-svh place-items-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
        <span className="sr-only">Checking your session…</span>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <Navigate to="/login" replace state={{ from: location.pathname }} />
    )
  }

  return <>{children}</>
}
