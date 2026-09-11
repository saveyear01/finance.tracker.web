import { useMutation, useQueryClient } from '@tanstack/react-query'

import { updateProfile } from '../api/auth-api'
import { authKeys } from '../api/auth-keys'

/**
 * Save profile fields (the name, today). The response is the updated user,
 * so it is written straight into the cache — the header greeting and the
 * avatar initials change without a `/me` round trip.
 *
 * Not optimistic, unlike the theme toggle: a name is typed and submitted, so
 * the form has a pending state to show, and a failed save should leave the
 * old name visibly in place.
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateProfile,
    onSuccess: (user) => {
      queryClient.setQueryData(authKeys.currentUser(), user)
    },
  })
}
