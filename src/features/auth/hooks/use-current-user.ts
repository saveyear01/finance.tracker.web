import { useQuery } from '@tanstack/react-query'

import { authKeys } from '../api/auth-keys'
import { getCurrentUser } from '../api/auth-api'

/**
 * The signed-in user. Because the session lives in HTTP-only cookies, this
 * query *is* the source of truth for "am I logged in?" — a 401 means no.
 */
export function useCurrentUser() {
  const query = useQuery({
    queryKey: authKeys.currentUser(),
    queryFn: getCurrentUser,
    staleTime: 5 * 60_000,
  })

  return {
    ...query,
    user: query.data ?? null,
    isAuthenticated: Boolean(query.data),
  }
}
