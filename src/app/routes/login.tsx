import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { AuthFormSkeleton, AuthLayout } from '@/components/layouts/auth-layout'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LoginForm, useCurrentUser } from '@/features/auth'

/** `from`: where to go after signing in. `notice`: why they're here (a PIN lock-out). */
type LocationState = { from?: string; notice?: string } | null

export function LoginRoute() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, isLoading } = useCurrentUser()

  const redirectTo = (location.state as LocationState)?.from ?? '/'
  const notice = (location.state as LocationState)?.notice

  // Someone who already has a valid session should never sit on /login.
  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectTo, { replace: true })
    }
  }, [isAuthenticated, navigate, redirectTo])

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your account to continue."
    >
      {notice && (
        <Alert className="mb-4">
          <AlertDescription>{notice}</AlertDescription>
        </Alert>
      )}
      {isLoading ? (
        <AuthFormSkeleton />
      ) : (
        <LoginForm onSuccess={() => navigate(redirectTo, { replace: true })} />
      )}
    </AuthLayout>
  )
}
