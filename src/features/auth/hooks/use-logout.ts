import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTheme } from 'next-themes'

import { logout } from '../api/auth-api'

export function useLogout() {
  const queryClient = useQueryClient()
  const { setTheme } = useTheme()

  return useMutation({
    mutationFn: logout,
    onSettled: () => {
      // Drop every cached query on the way out — none of it belongs to the
      // next person to sign in on this browser.
      queryClient.clear()
      // The theme is theirs too. Back to the app default, so the login
      // screen does not show the previous person's preference.
      setTheme('light')
    },
  })
}
