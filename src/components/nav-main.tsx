import { Link, useLocation, useSearchParams } from 'react-router-dom'

import { useNavBadges } from '@/components/layouts/use-nav-badges'
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar'
import { inSection, NAV_GROUPS, type NavBadge, type NavItem } from '@/config/navigation'
import { cn } from '@/lib/utils'

/** How each badge reads: red is owed now, amber is slipping. */
const BADGE: Record<NavBadge, { tone: string; text: (n: number) => string; sr: string }> = {
  overdue: { tone: 'bg-destructive text-destructive-foreground', text: String, sr: 'overdue' },
  // Softer: a debt behind is slipping, not owed today. Red like the Debts
  // page's own "N payments behind".
  behind: { tone: 'bg-destructive/12 text-destructive', text: (n) => `${n} behind`, sr: 'behind' },
  overdrawn: { tone: 'bg-destructive text-destructive-foreground', text: String, sr: 'below zero' },
}

/**
 * The sidebar's sections in their groups — Overview, Money, Plan
 * (design/navigation-redesign.html, 2026-11-13). The active section shows
 * its own tabs under it (Funds → Wallets / Allocations); a badge says what
 * needs attention; a "Soon" item is listed but is not a link. Collapsed to
 * the icon rail, the headings fold into hairlines, a badge becomes a dot and
 * each item gets its tooltip.
 */
export function NavMain({ items }: { items: NavItem[] }) {
  const { pathname } = useLocation()
  const [params] = useSearchParams()
  const counts = useNavBadges()

  return (
    <>
      {NAV_GROUPS.map((group, index) => (
        <SidebarGroup key={group.id} className="py-1">
          <SidebarGroupLabel className="text-[0.6875rem] font-bold tracking-wider uppercase">
            {group.label}
          </SidebarGroupLabel>
          {index > 0 && (
            <div
              aria-hidden="true"
              className="mx-auto mb-1 hidden h-px w-6 bg-sidebar-border group-data-[collapsible=icon]:block"
            />
          )}
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {items
                .filter((item) => item.group === group.id)
                .map((item) => {
                  const { label, to, icon: Icon, end, soon, badge, children } = item
                  if (soon) {
                    return (
                      <SidebarMenuItem key={to}>
                        <SidebarMenuButton
                          tooltip={`${label} · coming soon`}
                          aria-disabled="true"
                          className="h-9 gap-3 px-3 text-sidebar-foreground/55 aria-disabled:pointer-events-auto aria-disabled:cursor-default aria-disabled:opacity-100 hover:bg-transparent hover:text-sidebar-foreground/55"
                        >
                          <Icon />
                          <span>{label}</span>
                        </SidebarMenuButton>
                        <SidebarMenuBadge className="rounded-full border bg-muted px-1.5 text-[0.625rem] font-bold tracking-wide text-muted-foreground uppercase">
                          Soon
                        </SidebarMenuBadge>
                      </SidebarMenuItem>
                    )
                  }

                  const isActive = inSection(pathname, to, end)
                  const count = badge ? counts[badge] : 0
                  const meta = badge ? BADGE[badge] : null
                  // Which tab of the section is open: the query, or the
                  // detail page's own segment (/funds/wallets/:id).
                  const tab = params.get('tab') ?? pathname.split('/')[2] ?? children?.[0]?.tab

                  return (
                    <SidebarMenuItem key={to}>
                      <SidebarMenuButton
                        tooltip={count && meta ? `${label} · ${count} ${meta.sr}` : label}
                        isActive={isActive}
                        render={<Link to={to} />}
                        className="relative h-9 gap-3 px-3"
                      >
                        <Icon />
                        <span>{label}</span>
                        {count > 0 && meta && (
                          <span
                            aria-hidden="true"
                            className="absolute top-1 right-1 hidden size-2 rounded-full bg-destructive group-data-[collapsible=icon]:block"
                          />
                        )}
                      </SidebarMenuButton>
                      {count > 0 && meta && (
                        <SidebarMenuBadge
                          className={cn('top-2! rounded-full px-1.5 font-bold', meta.tone)}
                        >
                          {meta.text(count)}
                          <span className="sr-only"> {meta.sr}</span>
                        </SidebarMenuBadge>
                      )}
                      {isActive && children && (
                        <SidebarMenuSub>
                          {children.map((child) => (
                            <SidebarMenuSubItem key={child.tab}>
                              <SidebarMenuSubButton
                                isActive={tab === child.tab}
                                render={<Link to={child.to} />}
                              >
                                <span>{child.label}</span>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      )}
                    </SidebarMenuItem>
                  )
                })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  )
}
