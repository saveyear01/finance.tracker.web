import { Outlet } from 'react-router-dom'

import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { useSyncUserTheme } from '@/features/auth'

import { MobileTabBar } from './mobile-tab-bar'

/**
 * The signed-in shell, from the dashboard-01 block: collapsible sidebar,
 * header, routed page. The bottom tab bar is the mobile navigation; the
 * sidebar's own offcanvas mode is left to desktop.
 */
export function AppLayout() {
  // Here rather than in the provider: only a signed-in shell has a user whose
  // preference applies.
  useSyncUserTheme()

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
      <SidebarInset>
        <SiteHeader />
        {/* Bottom padding clears the floating nav pill on mobile: its 60px,
            the 1rem it floats by, and the home-indicator inset. Every page,
            Home included (since 2026-11-11), scrolls as a whole. */}
        <div className="flex flex-1 flex-col gap-4 p-4 pb-[calc(env(safe-area-inset-bottom)+6.5rem)] md:gap-6 lg:p-6 lg:pb-6">
          <Outlet />
        </div>
      </SidebarInset>
      <MobileTabBar />
    </SidebarProvider>
  )
}
