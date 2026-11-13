import { ChartPie, ChevronRight, Download, Loader2, LogOut, Moon, UserRound } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { Switch } from '@/components/ui/switch'
import { useAllocation } from '@/features/allocations'
import { useCurrentUser, useLogout, useUpdateTheme } from '@/features/auth'
import { getApiErrorMessage } from '@/lib/api-client'
import { cn } from '@/lib/utils'

const ROW =
  'flex min-h-14 w-full items-center gap-3 px-4 text-left transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none'

/** The page open beside the menu on a big screen: the accent ground (as on
 * hover) and a primary bar down its leading edge. */
const SELECTED = 'bg-accent shadow-[inset_3px_0_0_var(--color-primary)]'

/** A row that opens a sub-page — selected when that page is the one open,
 * which only happens beside it (on a phone the menu is a page of its own). */
function PageRow({
  to,
  icon,
  title,
  detail,
}: {
  to: string
  icon: typeof UserRound
  title: string
  detail: string
}) {
  const { pathname } = useLocation()
  const selected = pathname === to
  return (
    <li>
      <Link
        to={to}
        aria-current={selected ? 'page' : undefined}
        className={cn(ROW, selected && SELECTED)}
      >
        <RowIcon icon={icon} />
        <span className="flex-1">
          <span className="block font-medium">{title}</span>
          <span className="block text-sm text-muted-foreground">{detail}</span>
        </span>
        <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
      </Link>
    </li>
  )
}

function RowIcon({ icon: Icon }: { icon: typeof UserRound }) {
  return (
    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted">
      <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
    </span>
  )
}

/**
 * The profile page's options, as a settings list: rows that open a sub-page
 * carry a chevron, a row that toggles carries its switch. Like the nav, only
 * rows whose page exists are listed.
 */
export function ProfileMenu() {
  const { user } = useCurrentUser()
  const { rules } = useAllocation()
  const updateTheme = useUpdateTheme()
  const logout = useLogout()
  const navigate = useNavigate()

  if (!user) {
    return null
  }

  const isDark = user.theme === 'dark'
  const allocationSummary =
    rules.length === 0
      ? 'Not set up — income stays in Unallocated'
      : `${rules.length} ${rules.length === 1 ? 'allocation' : 'allocations'} · 100% of income`

  return (
    <>
      <ul className="divide-y divide-border overflow-hidden card-surface">
        <PageRow
          to="/profile/settings"
          icon={UserRound}
          title="Profile settings"
          detail="Name and password"
        />
        <PageRow
          to="/profile/income-split"
          icon={ChartPie}
          title="Income split"
          detail={allocationSummary}
        />
        <PageRow
          to="/profile/export"
          icon={Download}
          title="Export data"
          detail="Download your entries as a spreadsheet"
        />
        <li>
          {/* A label, so the whole row toggles — not just the small switch. */}
          <label className={`${ROW} cursor-pointer`}>
            <RowIcon icon={Moon} />
            <span className="flex-1">
              <span className="block font-medium">Dark mode</span>
              <span className="block text-sm text-muted-foreground">
                Saved to your account
              </span>
            </span>
            <Switch
              checked={isDark}
              onCheckedChange={(checked) =>
                updateTheme.mutate(checked ? 'dark' : 'light', {
                  onError: (error) =>
                    toast.error(getApiErrorMessage(error, "Couldn't save your theme. Try again.")),
                })
              }
            />
          </label>
        </li>
      </ul>

      <div className="overflow-hidden card-surface">
        <button
          type="button"
          className={`${ROW} text-destructive`}
          disabled={logout.isPending}
          onClick={() =>
            logout.mutate(undefined, {
              onSettled: () => navigate('/login', { replace: true }),
            })
          }
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-destructive/10">
            {logout.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <LogOut className="size-4" aria-hidden="true" />
            )}
          </span>
          <span className="font-medium">{logout.isPending ? 'Signing out…' : 'Sign out'}</span>
        </button>
      </div>
    </>
  )
}
