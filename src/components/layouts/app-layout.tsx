import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'

import { AppSidebar } from '@/components/app-sidebar'
import { CommandPaletteProvider, isTyping } from '@/components/command-palette'
import { SiteHeader } from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { useSyncUserTheme } from '@/features/auth'

import { MobileTabBar } from './mobile-tab-bar'
import { NewEntryProvider, useNewEntry } from './new-entry'

/**
 * Whether the sidebar starts expanded: what it was left at on this device
 * (the sidebar's own cookie), else expanded from xl (1280px) and the icon
 * rail below it, where Funds' and Debts' split views need the room.
 */
function sidebarStartsOpen(): boolean {
  const saved = document.cookie.match(/(?:^|; )sidebar_state=(true|false)/)?.[1]
  if (saved) return saved === 'true'
  return window.matchMedia('(min-width: 1280px)').matches
}

/** N opens a new entry — unless typing, or something is already open. */
function NewEntryShortcut() {
  const { openSheet } = useNewEntry()
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'n' || event.metaKey || event.ctrlKey || event.altKey || isTyping(event)) return
      if (document.querySelector('[role="dialog"], [role="alertdialog"]')) return
      event.preventDefault()
      openSheet()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openSheet])
  return null
}

/**
 * The signed-in shell: the grouped sidebar (an icon rail when collapsed),
 * header, routed page, and on a phone the floating pill with its + button.
 * "New entry" and the command palette are app-wide, so their providers wrap
 * everything that can open them.
 */
export function AppLayout() {
  // Here rather than in the provider: only a signed-in shell has a user whose
  // preference applies.
  useSyncUserTheme()

  return (
    <NewEntryProvider>
      <CommandPaletteProvider>
        <NewEntryShortcut />
        <SidebarProvider
          defaultOpen={sidebarStartsOpen()}
          style={
            {
              '--sidebar-width': 'calc(var(--spacing) * 66)',
              '--sidebar-width-icon': 'calc(var(--spacing) * 15)',
              '--header-height': 'calc(var(--spacing) * 12)',
            } as React.CSSProperties
          }
        >
          <AppSidebar variant="inset" />
          <SidebarInset>
            <SiteHeader />
            {/* Bottom padding clears the floating nav on mobile: its 52px,
                the 1rem it floats by, and the home-indicator inset. Every
                page, Home included (since 2026-11-11), scrolls as a whole. */}
            <div className="flex flex-1 flex-col gap-4 p-4 pb-[calc(env(safe-area-inset-bottom)+6.5rem)] md:gap-6 lg:p-6 lg:pb-6">
              <Outlet />
            </div>
          </SidebarInset>
          <MobileTabBar />
        </SidebarProvider>
      </CommandPaletteProvider>
    </NewEntryProvider>
  )
}
