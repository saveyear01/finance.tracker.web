import { Plus } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'

import { inSection, PILL_ITEMS } from '@/config/navigation'
import { cn } from '@/lib/utils'

import { useNewEntry } from './new-entry'
import { lastPlanPath } from './plan-switch'
import { useNavBadges } from './use-nav-badges'

/**
 * Mobile navigation (design/navigation-redesign.html, 2026-11-13): the
 * floating dark pill, five destinations, and a detached round + beside it
 * for a new entry from any page. Hidden from `lg` up, where the sidebar
 * takes over.
 *
 * The active item opens into icon + label on mint, so where you are is
 * always written down; the rest stay icon-only, carrying their label for
 * screen readers and pointer users. Below 390px there isn't room for the
 * label, and the active item keeps the mint circle alone.
 *
 * Plan stands for Upcoming AND Debts, and returns to whichever was open last.
 * A red dot on it while a bill is overdue.
 */
export function MobileTabBar() {
  const { pathname } = useLocation()
  const { openSheet } = useNewEntry()
  const badges = useNavBadges()

  return (
    <nav
      aria-label="Main"
      // The strip spans the width only to centre the dock; it must not eat
      // taps on the content showing either side of it.
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 lg:hidden"
      // Clear of the iOS home indicator, then a gap so the pill floats.
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)' }}
    >
      <div className="pointer-events-auto flex items-center gap-2">
        <ul className="flex items-center gap-0.5 rounded-full bg-nav p-1 dark:border dark:border-border">
          {PILL_ITEMS.map(({ label, to, icon: Icon, end, matches }) => {
            const isActive = matches.some((m) => inSection(pathname, m, end))
            const href = label === 'Plan' ? lastPlanPath() : to
            const dot = label === 'Plan' && badges.overdue > 0 && !isActive
            return (
              <li key={label}>
                <NavLink
                  to={href}
                  end={end}
                  aria-label={dot ? `${label}, ${badges.overdue} overdue` : label}
                  aria-current={isActive ? 'page' : undefined}
                  title={label}
                  className={cn(
                    'relative flex h-11 min-w-11 items-center justify-center gap-1.5 rounded-full text-sm font-semibold transition-[background-color,color,padding] duration-200 outline-none focus-visible:ring-2 focus-visible:ring-nav-foreground/60 motion-reduce:transition-none',
                    isActive
                      ? 'bg-secondary-accent text-secondary min-[390px]:pr-4 min-[390px]:pl-3'
                      : 'text-nav-foreground/60 hover:text-nav-foreground',
                  )}
                >
                  <Icon className="size-5 shrink-0" aria-hidden="true" />
                  {isActive && (
                    <span className="hidden animate-in fade-in duration-200 min-[390px]:inline motion-reduce:animate-none">
                      {label}
                    </span>
                  )}
                  {dot && (
                    <span
                      aria-hidden="true"
                      className="absolute top-2 right-2 size-2 rounded-full bg-secondary-negative ring-2 ring-nav"
                    />
                  )}
                </NavLink>
              </li>
            )
          })}
        </ul>
        <button
          type="button"
          onClick={openSheet}
          aria-label="New entry"
          title="New entry"
          className="grid size-13 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition-transform outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-95"
        >
          <Plus className="size-6" strokeWidth={2.4} aria-hidden="true" />
        </button>
      </div>
    </nav>
  )
}
