import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { AuthFormSkeleton, AuthLayout } from '@/components/layouts/auth-layout'
import { LoginForm, useCurrentUser } from '@/features/auth'

type LocationState = { from?: string } | null

export function LoginRoute() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, isLoading } = useCurrentUser()

  const redirectTo = (location.state as LocationState)?.from ?? '/'

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
      {isLoading ? (
        <AuthFormSkeleton />
      ) : (
        <LoginForm onSuccess={() => navigate(redirectTo, { replace: true })} />
      )}
    </AuthLayout>
  )
}
