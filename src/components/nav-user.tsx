import {
  ChevronsUpDown,
  Download,
  LogOutIcon,
  Moon,
  PieChart,
  Sun,
  UserRoundIcon,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { useCurrentUser, useLogout, useUpdateTheme, type ThemePreference } from '@/features/auth'
import { getApiErrorMessage } from '@/lib/api-client'
import { initials } from '@/lib/initials'

/**
 * The account card at the sidebar's foot and its menu — the "You" group
 * (design/navigation-redesign.html, 2026-11-13): Profile, Income split,
 * Export data, the theme, then Log out last. The same things Profile's list
 * holds on a phone, so neither size has something the other lacks.
 */
export function NavUser() {
  const { isMobile } = useSidebar()
  const { user } = useCurrentUser()
  const logout = useLogout()
  const updateTheme = useUpdateTheme()
  const navigate = useNavigate()

  if (!user) {
    return null
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                tooltip={user.name}
                className="border border-sidebar-border bg-card aria-expanded:ring-2 aria-expanded:ring-sidebar-ring group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:bg-transparent"
              />
            }
          >
            <Avatar className="size-8 rounded-lg">
              <AvatarFallback className="rounded-lg">{initials(user.name)}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{user.name}</span>
              <span className="truncate text-xs text-muted-foreground">{user.email}</span>
            </div>
            <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
          </DropdownMenuTrigger>

          <DropdownMenuContent
            // Opens upward, the width of the card it came from — on the
            // icon rail there is no card width, so it keeps its own.
            className="w-(--anchor-width) min-w-60"
            side={isMobile ? 'bottom' : 'top'}
            align="start"
            sideOffset={8}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="truncate text-xs font-normal text-muted-foreground">
                Signed in as {user.email}
              </DropdownMenuLabel>
              <DropdownMenuItem render={<Link to="/profile" />}>
                <UserRoundIcon />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link to="/profile/income-split" />}>
                <PieChart />
                Income split
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link to="/profile/export" />}>
                <Download />
                Export data
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                Theme
              </DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={user.theme}
                onValueChange={(value) =>
                  updateTheme.mutate(value as ThemePreference, {
                    onError: (error) =>
                      toast.error(getApiErrorMessage(error, "Couldn't save your theme. Try again.")),
                  })
                }
              >
                <DropdownMenuRadioItem value="light" closeOnClick={false}>
                  <Sun />
                  Light
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="dark" closeOnClick={false}>
                  <Moon />
                  Dark
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={logout.isPending}
              onClick={() =>
                logout.mutate(undefined, {
                  onSettled: () => navigate('/login', { replace: true }),
                })
              }
            >
              <LogOutIcon />
              {logout.isPending ? 'Signing out…' : 'Log out'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
