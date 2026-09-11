import { apiClient, unwrap } from '@/lib/api-client'

import type { CurrentUser, LoginCredentials, PasswordChange, ProfileUpdate } from '../types'

/**
 * `POST /api/auth/login/` — validates the credentials, sets the `access_token`
 * and `refresh_token` HTTP-only cookies, and returns the user.
 *
 * The user comes back in the body deliberately, so the client does not need a
 * follow-up `/users/me/` call just to render the header.
 */
export function login(credentials: LoginCredentials): Promise<CurrentUser> {
  return unwrap(apiClient.post<CurrentUser>('/auth/login/', credentials))
}

/** `PUT /api/auth/logout/` — clears both cookies. Responds 204. */
export async function logout(): Promise<void> {
  await apiClient.put('/auth/logout/')
}

/** `GET /api/users/me/` — the authenticated user, or 401 when signed out. */
export function getCurrentUser(): Promise<CurrentUser> {
  return unwrap(apiClient.get<CurrentUser>('/users/me/'))
}

/** `PATCH /api/users/me/` — change the caller's own preferences. */
export function updateProfile(update: ProfileUpdate): Promise<CurrentUser> {
  return unwrap(apiClient.patch<CurrentUser>('/users/me/', update))
}

/**
 * `PUT /api/users/me/password/` — responds 204 with fresh cookies for this
 * session; every other session is signed out. A wrong current password is a
 * 400, not a 401, so it never triggers the refresh-and-retry interceptor.
 */
export async function changePassword(change: PasswordChange): Promise<void> {
  await apiClient.put('/users/me/password/', change)
}
