import { Link, useLocation } from 'react-router-dom'

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import type { NavItem } from '@/config/navigation'

export function NavMain({ items }: { items: NavItem[] }) {
  const { pathname } = useLocation()

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        {/* SidebarMenu defaults to gap-0, which sits the items flush together. */}
        <SidebarMenu className="gap-1.5">
          {items.map(({ label, to, icon: Icon, end }) => {
            // `end` keeps "/" from matching every route; the rest match their
            // own subtree so a future /trades/:id keeps Trades highlighted.
            const isActive = end
              ? pathname === to
              : pathname === to || pathname.startsWith(`${to}/`)

            return (
              <SidebarMenuItem key={to}>
                <SidebarMenuButton
                  tooltip={label}
                  isActive={isActive}
                  render={<Link to={to} />}
                  className="h-9 gap-3 px-3"
                >
                  <Icon />
                  <span>{label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
