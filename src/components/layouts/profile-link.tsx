import { Link } from 'react-router-dom'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useCurrentUser } from '@/features/auth'
import { initials } from '@/lib/initials'
import { cn } from '@/lib/utils'

/**
 * The avatar that leads the mobile header. It opens the Profile page, which
 * now holds what used to be in a dropdown here (sign out included) — one
 * place for account things, reachable from the nav pill as well.
 */
export function ProfileLink({ className }: { className?: string }) {
  const { user } = useCurrentUser()

  if (!user) {
    return null
  }

  return (
    <Link
      to="/profile"
      aria-label="Your profile"
      className={cn(
        'shrink-0 rounded-full focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
        className,
      )}
    >
      <Avatar className="size-10">
        <AvatarFallback className="font-medium">{initials(user.name)}</AvatarFallback>
      </Avatar>
    </Link>
  )
}
