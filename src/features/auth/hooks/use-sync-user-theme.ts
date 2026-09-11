import { useEffect } from 'react'
import { useTheme } from 'next-themes'

import { useCurrentUser } from './use-current-user'

/**
 * Keep the page's theme in step with the signed-in user's saved preference.
 *
 * The account is the source of truth; next-themes' own localStorage copy is
 * only a cache that lets a reload paint in the right theme before `/me`
 * answers. On a device the user has never used, that cache is empty, so the
 * first load paints light and switches once `/me` arrives — the one flash
 * that cannot be avoided without the server rendering HTML.
 *
 * Mounted once, in the signed-in shell.
 */
export function useSyncUserTheme() {
  const { user } = useCurrentUser()
  const { theme, setTheme } = useTheme()
  const saved = user?.theme

  useEffect(() => {
    if (saved && saved !== theme) {
      setTheme(saved)
    }
  }, [saved, theme, setTheme])
}
