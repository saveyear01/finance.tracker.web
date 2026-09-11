import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTheme } from 'next-themes'

import { updateProfile } from '../api/auth-api'
import { authKeys } from '../api/auth-keys'
import type { CurrentUser, ThemePreference } from '../types'

/**
 * Switch the theme and save it to the user's account.
 *
 * Optimistic: the page changes on tap, and the cached user is updated in the
 * same breath so `useSyncUserTheme` does not see the server's (old) value and
 * switch it straight back. If the save fails, both are rolled back — the
 * theme on screen never claims a preference the account does not have.
 */
export function useUpdateTheme() {
  const queryClient = useQueryClient()
  const { setTheme } = useTheme()

  return useMutation({
    mutationFn: (theme: ThemePreference) => updateProfile({ theme }),
    onMutate: async (theme) => {
      // A /me refetch landing mid-flight would carry the old theme.
      await queryClient.cancelQueries({ queryKey: authKeys.currentUser() })

      const previous = queryClient.getQueryData<CurrentUser>(authKeys.currentUser())
      setTheme(theme)
      if (previous) {
        queryClient.setQueryData<CurrentUser>(authKeys.currentUser(), { ...previous, theme })
      }
      return { previous }
    },
    onError: (_error, _theme, context) => {
      if (context?.previous) {
        queryClient.setQueryData(authKeys.currentUser(), context.previous)
        setTheme(context.previous.theme)
      }
    },
    onSuccess: (user) => {
      queryClient.setQueryData(authKeys.currentUser(), user)
    },
  })
}
