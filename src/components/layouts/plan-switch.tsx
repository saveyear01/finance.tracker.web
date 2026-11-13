import { useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

import { useNavBadges } from './use-nav-badges'

const KEY = 'plan-tab'
type PlanPath = '/upcoming' | '/debts'

/** Where the pill's Plan goes: the half of Plan open last, on this device. */
export function lastPlanPath(): PlanPath {
  try {
    return localStorage.getItem(KEY) === '/debts' ? '/debts' : '/upcoming'
  } catch {
    return '/upcoming'
  }
}

function remember(path: PlanPath) {
  try {
    localStorage.setItem(KEY, path)
  } catch {
    // Private mode or blocked storage: Plan opens on Upcoming.
  }
}

/**
 * Plan's two tabs on a phone — Upcoming and Debts as one page, the way Funds
 * holds Wallets and Allocations (design/navigation-redesign.html). Each is
 * still its own route, so a link or a reload lands where it should; this
 * only joins them under the one pill item. Hidden from `lg`, where the
 * sidebar lists both.
 */
export function PlanSwitch() {
  const { pathname } = useLocation()
  const { overdue } = useNavBadges()
  const current: PlanPath = pathname.startsWith('/debts') ? '/debts' : '/upcoming'
  useEffect(() => remember(current), [current])

  const tabs: { path: PlanPath; label: string; count?: number }[] = [
    { path: '/upcoming', label: 'Upcoming', count: overdue },
    { path: '/debts', label: 'Debts' },
  ]

  return (
    <nav aria-label="Plan" className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1 lg:hidden">
      {tabs.map(({ path, label, count }) => (
        <NavLink
          key={path}
          to={path}
          replace
          className={({ isActive }) =>
            [
              'flex h-9 items-center justify-center gap-1.5 rounded-[0.625rem] text-sm font-semibold transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
              isActive
                ? 'bg-card text-foreground ring-1 ring-border'
                : 'text-muted-foreground hover:text-foreground',
            ].join(' ')
          }
        >
          {label}
          {count ? (
            <span className="rounded-full bg-destructive px-1.5 text-[0.6875rem] leading-4.5 font-bold text-destructive-foreground">
              {count}
              <span className="sr-only"> overdue</span>
            </span>
          ) : null}
        </NavLink>
      ))}
    </nav>
  )
}
