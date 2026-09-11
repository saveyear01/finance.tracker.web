import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useCurrentUser } from '@/features/auth'
import { initials } from '@/lib/initials'

/**
 * Who is signed in — the dark hero card of the design reference, drawn in the
 * theme's navy `secondary` rather than a hard-coded black.
 */
export function ProfileCard() {
  const { user } = useCurrentUser()

  if (!user) {
    return null
  }

  return (
    <section className="flex items-center gap-4 rounded-xl bg-secondary p-5 text-secondary-foreground">
      <Avatar className="size-16">
        <AvatarFallback className="bg-secondary-foreground/15 text-xl font-semibold text-secondary-foreground">
          {initials(user.name)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate text-lg font-semibold">{user.name}</p>
        <p className="truncate text-sm text-secondary-foreground/70">{user.email}</p>
      </div>
    </section>
  )
}
