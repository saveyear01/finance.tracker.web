import { useMutation, useQueryClient } from '@tanstack/react-query'

import { login } from '../api/auth-api'
import { authKeys } from '../api/auth-keys'
import { appLock } from '../lib/app-lock'

export function useLogin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: login,
    onSuccess: (user) => {
      // They just proved who they are with the password — don't ask for
      // the PIN on top.
      appLock.unlock()
      // Login already returned the user, so seed the cache with it rather than
      // invalidating — that would spend a second round trip on /users/me/ to
      // fetch what we are holding, and leave the guard loading in the meantime.
      queryClient.setQueryData(authKeys.currentUser(), user)
    },
  })
}
