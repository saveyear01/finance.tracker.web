import { useMutation, useQueryClient } from '@tanstack/react-query'

import { setPin, unlockWithPin } from '../api/auth-api'
import { authKeys } from '../api/auth-keys'
import { appLock } from '../lib/app-lock'

/**
 * Set, change or turn off the PIN. The response is the user (with the new
 * `has_pin`), so it goes straight into the cache. Setting one leaves the app
 * unlocked — the password was just typed — rather than locking it at once.
 */
export function useSetPin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: setPin,
    onSuccess: (user) => {
      appLock.unlock()
      queryClient.setQueryData(authKeys.currentUser(), user)
    },
  })
}

/**
 * Unlock with the PIN. On a lock-out (403 `pin_locked`) every session was
 * signed out server-side; dropping the cache makes the route guard see it
 * and send the user to the login page.
 */
export function useUnlock() {
  return useMutation({
    mutationFn: unlockWithPin,
    onSuccess: () => appLock.unlock(),
  })
}
