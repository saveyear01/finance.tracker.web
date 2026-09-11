import { ChevronLeft } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { env } from '@/config/env'
import { NAV_ITEMS, SUB_PAGES } from '@/config/navigation'
import { useCurrentUser } from '@/features/auth'

/** Navigation state a link can pass so a sub-page's back button returns to it. */
type BackState = { from?: string }

/**
 * What the header shows for the current route: a sub-page's own title (and
 * where "back" goes), otherwise the nav label of the section it is in.
 *
 * "Back" is the page the user actually came from when the link that opened
 * the sub-page said so (`state.from` — Funds opening Allocation, say), and
 * the sub-page's own parent otherwise: a direct visit or a reload has no
 * state, and still needs somewhere sensible to go.
 */
function usePageHeading(): { title: string; back?: string; mobileBack?: string } {
  const { pathname, state } = useLocation()

  const sub = SUB_PAGES.find((page) => page.path === pathname)
  if (sub) {
    const from = (state as BackState | null)?.from
    // In-app paths only — state is ours, but a relative path is never meant.
    return { title: sub.title, back: from?.startsWith('/') ? from : sub.back }
  }

  const match = NAV_ITEMS.find((item) =>
    item.end ? pathname === item.to : pathname.startsWith(item.to),
  )
  // A page the mobile pill doesn't show needs a way back on a phone.
  const from = (state as BackState | null)?.from
  const mobileBack =
    match?.inPill === false ? (from?.startsWith('/') ? from : '/') : undefined
  return { title: match?.label ?? env.APP_NAME, mobileBack }
}

function BackButton({ to, className }: { to: string; className?: string }) {
  return (
    <Button
      variant="outline"
      size="icon"
      aria-label="Back"
      className={className}
      render={<Link to={to} />}
    >
      <ChevronLeft />
    </Button>
  )
}

/**
 * Two headers, switched in CSS at `lg` like the lists are — `useIsMobile`
 * resolves in an effect, so a phone would paint the desktop header first.
 * `hidden` is `display: none`, so only one `<h1>` is ever in the
 * accessibility tree.
 */
export function SiteHeader() {
  const { title, back, mobileBack } = usePageHeading()
  const mobileBackTo = back ?? mobileBack
  const { pathname } = useLocation()
  const { user } = useCurrentUser()

  return (
    <>
      {/* Desktop: the dashboard-01 bar — sidebar toggle and page title. */}
      <header className="hidden h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height) lg:flex">
        <div className="flex w-full items-center gap-2 px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mx-2 h-4 data-vertical:self-auto"
          />
          {back && <BackButton to={back} className="size-7 rounded-full" />}
          <h1 className="text-base font-medium">{title}</h1>
        </div>
      </header>

      {/*
        Mobile, after the design reference. Top-level pages lead with the
        avatar (a link to Profile), greeting by name on the home page. A
        sub-page leads with a round back button instead. No divider; the
        header sits on the page's own background.
      */}
      <header className="flex shrink-0 items-center gap-3 px-4 pt-4 pb-2 lg:hidden">
        {mobileBackTo ? (
          <BackButton to={mobileBackTo} className="size-10 shrink-0 rounded-full" />
        ) : (
          <></>
        )}
        {pathname === '/' && user ? (
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold">
              Hi, {user.first_name} <span aria-hidden="true">👋</span>
            </h1>
            <p className="truncate text-xs text-muted-foreground">
              Here's where your money stands.
            </p>
          </div>
        ) : (
          <h1 className="truncate text-lg font-semibold">{title}</h1>
        )}
        {/* Where the reference puts its round header actions. */}
      </header>
    </>
  )
}
