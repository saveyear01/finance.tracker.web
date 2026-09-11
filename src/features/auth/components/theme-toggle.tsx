import { Moon, Sun } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { getApiErrorMessage } from '@/lib/api-client'
import { cn } from '@/lib/utils'

import { useCurrentUser } from '../hooks/use-current-user'
import { useUpdateTheme } from '../hooks/use-update-theme'

/**
 * Light/dark switch for the header — a round icon button, like the reference
 * design's header actions. Shows where a tap will take you: a moon in light
 * mode, a sun in dark.
 *
 * Reads the theme from the user rather than from next-themes: the account is
 * the source of truth, and the optimistic update keeps the two equal anyway.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { user } = useCurrentUser()
  const updateTheme = useUpdateTheme()

  if (!user) {
    return null
  }

  const isDark = user.theme === 'dark'
  const next = isDark ? 'light' : 'dark'

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
      className={cn('rounded-full', className)}
      onClick={() =>
        updateTheme.mutate(next, {
          onError: (error) =>
            toast.error(getApiErrorMessage(error, "Couldn't save your theme. Try again.")),
        })
      }
    >
      {isDark ? <Sun /> : <Moon />}
    </Button>
  )
}
