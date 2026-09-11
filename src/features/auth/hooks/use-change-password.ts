import { useMutation } from '@tanstack/react-query'

import { changePassword } from '../api/auth-api'

/**
 * Change the password. Nothing to update in the cache: the user object does
 * not change, and the fresh session cookies arrive on the response itself.
 */
export function useChangePassword() {
  return useMutation({ mutationFn: changePassword })
}
