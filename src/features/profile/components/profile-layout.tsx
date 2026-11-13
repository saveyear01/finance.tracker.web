import type { ReactNode } from 'react'

import { SplitView } from '@/components/layouts/split-view'
import { cn } from '@/lib/utils'

import { ProfileCard } from './profile-card'
import { ProfileMenu } from './profile-menu'

/**
 * A profile sub-page as a settings layout: from `lg` the profile card and
 * the menu in a narrow column on the left, the chosen page's row selected,
 * and the page beside it (large-screen.html, Profile). Below `lg` only the
 * page shows, as its own screen — the menu is `/profile`, one step back.
 *
 * The page is capped at 640px, since a form stretched across the pane reads
 * badly; `wide` (720px) is for Income split, whose rows carry a name, a
 * percentage and a remove button.
 */
export function ProfileLayout({
  children,
  wide = false,
}: {
  children: ReactNode
  wide?: boolean
}) {
  return (
    <SplitView
      listWidth="narrow"
      list={
        <div className="space-y-4">
          <ProfileCard />
          <ProfileMenu />
        </div>
      }
      detail={<div className={cn('space-y-4', wide ? 'max-w-180' : 'max-w-160')}>{children}</div>}
    />
  )
}
