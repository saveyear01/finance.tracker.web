import { ChartPie, ChevronRight, Loader2, LogOut, Moon, UserRound } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { Switch } from '@/components/ui/switch'
import { useAllocation } from '@/features/allocations'
import { useCurrentUser, useLogout, useUpdateTheme } from '@/features/auth'
import { getApiErrorMessage } from '@/lib/api-client'

const ROW =
  'flex min-h-14 w-full items-center gap-3 px-4 text-left transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none'

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
      <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
        <li>
          <Link to="/profile/settings" className={ROW}>
            <RowIcon icon={UserRound} />
            <span className="flex-1">
              <span className="block font-medium">Profile settings</span>
              <span className="block text-sm text-muted-foreground">Name and password</span>
            </span>
            <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
          </Link>
        </li>
        <li>
          <Link to="/profile/income-split" className={ROW}>
            <RowIcon icon={ChartPie} />
            <span className="flex-1">
              <span className="block font-medium">Income split</span>
              <span className="block text-sm text-muted-foreground">{allocationSummary}</span>
            </span>
            <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
          </Link>
        </li>
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

      <div className="overflow-hidden rounded-xl border border-border bg-card">
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
