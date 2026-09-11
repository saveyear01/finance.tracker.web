import { Outlet, useLocation } from 'react-router-dom'

import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { useSyncUserTheme } from '@/features/auth'
import { cn } from '@/lib/utils'

import { MobileTabBar } from './mobile-tab-bar'

/**
 * Pages laid out like an app screen rather than a document: the shell is
 * exactly one viewport tall, and the page decides which part of itself
 * scrolls (Home keeps its balance card still and scrolls only the activity).
 * Every other page scrolls as a whole, the normal way.
 */
const SCREEN_PAGES = new Set(['/'])

/**
 * The signed-in shell, from the dashboard-01 block: collapsible sidebar,
 * header, routed page. The bottom tab bar is the mobile navigation; the
 * sidebar's own offcanvas mode is left to desktop.
 */
export function AppLayout() {
  // Here rather than in the provider: only a signed-in shell has a user whose
  // preference applies.
  useSyncUserTheme()
  const { pathname } = useLocation()
  const screen = SCREEN_PAGES.has(pathname)

  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': 'calc(var(--spacing) * 72)',
          '--header-height': 'calc(var(--spacing) * 12)',
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset
        className={cn(
          // One viewport tall. From `md` the inset variant adds a 0.5rem margin
          // above and below, so the inset itself is 1rem shorter there.
          screen && 'h-svh md:peer-data-[variant=inset]:h-[calc(100svh-1rem)]',
        )}
      >
        <SiteHeader />
        {/* Bottom padding clears the floating nav pill on mobile: its 60px,
            the 1rem it floats by, and the home-indicator inset. On a screen
            page, `min-h-0` lets this shrink to what is left under the header,
            and `overflow-y-auto` is the fallback for a viewport too short to
            fit the page's fixed parts — it scrolls whole rather than clips. */}
        <div
          className={cn(
            'flex flex-1 flex-col gap-4 p-4 pb-[calc(env(safe-area-inset-bottom)+6.5rem)] md:gap-6 lg:p-6 lg:pb-6',
            screen && 'min-h-0 overflow-y-auto',
          )}
        >
          <Outlet />
        </div>
      </SidebarInset>
      <MobileTabBar />
    </SidebarProvider>
  )
}
