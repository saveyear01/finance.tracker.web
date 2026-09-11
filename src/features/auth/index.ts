/**
 * Public surface of the auth feature. Nothing outside `features/auth`
 * should import from its subfolders directly.
 */
export { LoginForm } from './components/login-form'
export { ProtectedRoute } from './components/protected-route'
export { ThemeToggle } from './components/theme-toggle'
export { useChangePassword } from './hooks/use-change-password'
export { useCurrentUser } from './hooks/use-current-user'
export { useUpdateProfile } from './hooks/use-update-profile'
export { useLogin } from './hooks/use-login'
export { useLogout } from './hooks/use-logout'
export { useSyncUserTheme } from './hooks/use-sync-user-theme'
export { useUpdateTheme } from './hooks/use-update-theme'
export { authKeys } from './api/auth-keys'
export type { CurrentUser, LoginCredentials, ThemePreference } from './types'
