import { Plus, Search } from 'lucide-react'
import type * as React from 'react'
import { Link } from 'react-router-dom'

import { BrandMark } from '@/components/brand-mark'
import { useCommandPalette } from '@/components/command-palette'
import { useNewEntry } from '@/components/layouts/new-entry'
import { NavMain } from '@/components/nav-main'
import { NavUser } from '@/components/nav-user'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { env } from '@/config/env'
import { NAV_ITEMS } from '@/config/navigation'

/** A key hint, hidden on the icon rail. */
function Kbd({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd
      className={`ml-auto rounded-md px-1.5 text-[0.6875rem] font-semibold group-data-[collapsible=icon]:hidden ${className}`}
    >
      {children}
    </kbd>
  )
}

/**
 * The desktop sidebar (design/navigation-redesign.html, 2026-11-13): the
 * brand (the page header's button collapses it); "New entry" (N) and search (⌘K); the
 * sections in their groups; the account card. Collapsed, it is a rail of
 * icons with tooltips rather than nothing — `[` toggles it.
 */
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { openSheet } = useNewEntry()
  const openPalette = useCommandPalette()

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="gap-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:p-1.5!"
              render={<Link to="/" />}
              tooltip={env.APP_NAME}
            >
              {/* At 24px the favicon's simpler cut reads better than the full mark. */}
              <BrandMark simple className="size-6! rounded-[20%]" />
              <span className="text-base font-semibold">{env.APP_NAME}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <SidebarMenu className="gap-1.5">
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="New entry (N)"
              onClick={openSheet}
              className="h-10 gap-2 rounded-lg bg-primary px-3 font-semibold text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground"
            >
              <Plus className="size-4.5!" strokeWidth={2.4} />
              <span>New entry</span>
              <Kbd className="bg-primary-foreground/18">N</Kbd>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Search (⌘K)"
              onClick={openPalette}
              className="h-9 gap-2 rounded-lg border border-sidebar-border bg-card px-3 text-muted-foreground group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:bg-transparent"
            >
              <Search />
              <span>Search or jump to…</span>
              <Kbd className="border border-sidebar-border">⌘K</Kbd>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={NAV_ITEMS} />
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
