import { NavLink } from 'react-router-dom'

import { NAV_ITEMS } from '@/config/navigation'
import { cn } from '@/lib/utils'

/**
 * Mobile navigation: a floating, icon-only pill centred above the bottom
 * edge, after the design reference. Hidden from `lg` up, where the sidebar
 * takes over.
 *
 * The pill is drawn in `foreground` with `background`-coloured icons rather
 * than hard-coded black and white, so it reads as black-on-light today and
 * would invert rather than vanish if a dark theme came back.
 *
 * Icon-only, so each link carries its label for screen readers (`aria-label`)
 * and pointer users (`title`). NavLink sets `aria-current="page"` itself.
 */
export function MobileTabBar() {
  return (
    <nav
      aria-label="Main"
      // The strip spans the width only to centre the pill; it must not eat
      // taps on the content showing either side of it.
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 lg:hidden"
      // Clear of the iOS home indicator, then a gap so the pill floats.
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)' }}
    >
      <ul className="pointer-events-auto flex items-center gap-2 rounded-full bg-foreground p-1.5">
        {NAV_ITEMS.filter((item) => item.inPill !== false).map(({ label, to, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              aria-label={label}
              title={label}
              className={({ isActive }) =>
                cn(
                  'grid size-12 place-items-center rounded-full transition-colors outline-none focus-visible:ring-2 focus-visible:ring-background/60',
                  isActive
                    ? 'bg-background/15 text-background'
                    : 'text-background/55 hover:text-background',
                )
              }
            >
              <Icon className="size-5" aria-hidden="true" />
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
