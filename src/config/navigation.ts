import {
  ArrowUpDown,
  CalendarClock,
  House,
  Landmark,
  UserRound,
  Wallet,
  type LucideIcon,
} from 'lucide-react'

export type NavItem = {
  label: string
  /** Route path. Also the key React lists render by. */
  to: string
  icon: LucideIcon
  /**
   * `end` makes the active match exact. Only the index route needs it —
   * without it "/" would light up on every page.
   */
  end?: boolean
  /**
   * Whether the mobile pill shows it (default yes). Anything left out is in
   * the desktop sidebar only and reached from inside the app on a phone — its
   * header then offers a back button, since nothing in the pill leads there.
   */
  inPill?: boolean
}

/**
 * The one nav definition. The desktop sidebar and the mobile tab bar both
 * render this array, so an item can never exist in one and not the other.
 *
 * Only pages that exist are listed — never a dead link. The pill carries the
 * reference's five: home, funds, arrows, debts, profile. Upcoming is the one
 * sidebar-only page; on a phone it's reached from Home.
 */
export const NAV_ITEMS: NavItem[] = [
  { label: 'Home', to: '/', icon: House, end: true },
  // Wallets and allocations, as two tabs of one page.
  { label: 'Funds', to: '/funds', icon: Wallet },
  { label: 'Transactions', to: '/transactions', icon: ArrowUpDown },
  { label: 'Upcoming', to: '/upcoming', icon: CalendarClock, inPill: false },
  { label: 'Debts', to: '/debts', icon: Landmark },
  { label: 'Profile', to: '/profile', icon: UserRound },
]

export type SubPage = {
  /** Exact path of the sub-page. */
  path: string
  /** What the header calls it. */
  title: string
  /** Where the header's back button goes — the page it was opened from. */
  back: string
}

/**
 * Screens reached from inside a section rather than from the nav. The header
 * gives them a title and a round back button (after the design reference)
 * instead of the avatar; the nav keeps their parent highlighted.
 */
export const SUB_PAGES: SubPage[] = [
  { path: '/profile/settings', title: 'Profile settings', back: '/profile' },
  { path: '/profile/income-split', title: 'Income split', back: '/profile' },
  // One debt in full. `:debtId` stands for any one segment — see `matchSubPage`.
  { path: '/debts/:debtId', title: 'Debt', back: '/debts' },
]

/**
 * The sub-page a path is, if it is one.
 *
 * A `:param` segment matches any single non-empty segment, so a detail page
 * is listed once rather than per record. Segment counts must match, so
 * `/debts` itself stays a section rather than becoming its own detail page.
 */
export function matchSubPage(pathname: string): SubPage | undefined {
  const parts = pathname.split('/')
  return SUB_PAGES.find((page) => {
    const pattern = page.path.split('/')
    if (pattern.length !== parts.length) return false
    return pattern.every((segment, i) =>
      segment.startsWith(':') ? parts[i] !== '' : segment === parts[i],
    )
  })
}
