import type * as React from 'react'
import { Link } from 'react-router-dom'

import { BrandMark } from '@/components/brand-mark'
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

/**
 * The dashboard-01 sidebar, rewired: the block's sample nav is replaced by
 * NAV_ITEMS, and its hard-coded "shadcn / m@example.com" user by the real
 * session.
 */
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:p-1.5!"
              render={<Link to="/" />}
            >
              {/* At 24px the favicon's simpler cut reads better than the full mark. */}
              <BrandMark simple className="size-6! rounded-[20%]" />
              <span className="text-base font-semibold">{env.APP_NAME}</span>
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
