import {
  ArrowUpDown,
  CalendarClock,
  House,
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
 * Only pages that exist are listed — never a dead link. The pill has four
 * since Wallets and Funds merged (2026-09-11, the user kept it at four):
 * home, funds, arrows, profile. Upcoming is sidebar-only; on a phone it's
 * reached from Home.
 */
export const NAV_ITEMS: NavItem[] = [
  { label: 'Home', to: '/', icon: House, end: true },
  // Wallets and allocations, as two tabs of one page.
  { label: 'Funds', to: '/funds', icon: Wallet },
  { label: 'Transactions', to: '/transactions', icon: ArrowUpDown },
  { label: 'Upcoming', to: '/upcoming', icon: CalendarClock, inPill: false },
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
]
