import {
  ArrowUpDown,
  CalendarClock,
  ChartColumn,
  House,
  Landmark,
  TrendingUp,
  UserRound,
  Wallet,
  type LucideIcon,
} from 'lucide-react'

/** The sidebar's headed groups (design/navigation-redesign.html, 2026-11-13).
 * Profile sits apart, as the account card at the sidebar's foot. */
export type NavGroup = 'overview' | 'money' | 'plan' | 'you'

export const NAV_GROUPS: { id: Exclude<NavGroup, 'you'>; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'money', label: 'Money' },
  { id: 'plan', label: 'Plan' },
]

/** A live count beside an item — what needs attention, not decoration. */
export type NavBadge = 'overdue' | 'behind' | 'overdrawn'

export type NavItem = {
  label: string
  /** Route path. Also the key React lists render by. */
  to: string
  icon: LucideIcon
  group: NavGroup
  /**
   * `end` makes the active match exact. Only the index route needs it —
   * without it "/" would light up on every page.
   */
  end?: boolean
  /** Shown while active, under the item: a section's own tabs. */
  children?: { label: string; to: string; tab: string }[]
  badge?: NavBadge
  /**
   * Not built yet: listed dimmed with a "Soon" tag, and NOT a link — the
   * nav still never leads anywhere that doesn't exist.
   */
  soon?: boolean
}

/**
 * The one nav definition: the desktop sidebar renders it in its groups, and
 * the phone's pill (`PILL_ITEMS`) is cut from the same sections, so a page
 * can never exist in one and not the other.
 */
export const NAV_ITEMS: NavItem[] = [
  { label: 'Home', to: '/', icon: House, group: 'overview', end: true },
  { label: 'Analytics', to: '/analytics', icon: ChartColumn, group: 'overview' },
  {
    label: 'Funds',
    to: '/funds',
    icon: Wallet,
    group: 'money',
    badge: 'overdrawn',
    children: [
      { label: 'Wallets', to: '/funds?tab=wallets', tab: 'wallets' },
      { label: 'Allocations', to: '/funds?tab=allocations', tab: 'allocations' },
    ],
  },
  // "Activity" in the UI since 2026-11-13; the route stays /transactions.
  { label: 'Activity', to: '/transactions', icon: ArrowUpDown, group: 'money' },
  { label: 'Investments', to: '/investments', icon: TrendingUp, group: 'money', soon: true },
  { label: 'Upcoming', to: '/upcoming', icon: CalendarClock, group: 'plan', badge: 'overdue' },
  { label: 'Debts', to: '/debts', icon: Landmark, group: 'plan', badge: 'behind' },
  { label: 'Profile', to: '/profile', icon: UserRound, group: 'you' },
]

export type PillItem = {
  label: string
  to: string
  icon: LucideIcon
  end?: boolean
  /** Every section the item stands for — Plan is Upcoming AND Debts. */
  matches: string[]
}

/**
 * The phone's pill: five destinations. Plan is Upcoming and Debts as two
 * tabs of one page (the way Funds holds Wallets and Allocations); Profile is
 * the header's avatar, never a tab; Investments joins once it exists.
 */
export const PILL_ITEMS: PillItem[] = [
  { label: 'Home', to: '/', icon: House, end: true, matches: ['/'] },
  { label: 'Funds', to: '/funds', icon: Wallet, matches: ['/funds'] },
  { label: 'Activity', to: '/transactions', icon: ArrowUpDown, matches: ['/transactions'] },
  { label: 'Analytics', to: '/analytics', icon: ChartColumn, matches: ['/analytics'] },
  { label: 'Plan', to: '/upcoming', icon: CalendarClock, matches: ['/upcoming', '/debts'] },
]

/** Whether `pathname` is `section` or inside it. */
export function inSection(pathname: string, section: string, end = false): boolean {
  if (end || section === '/') return pathname === section
  return pathname === section || pathname.startsWith(`${section}/`)
}

/** Whether a phone reaches `pathname` from the pill (else it needs Back). */
export function inPill(pathname: string): boolean {
  return PILL_ITEMS.some((item) => item.matches.some((m) => inSection(pathname, m, item.end)))
}

export type SubPage = {
  /** Exact path of the sub-page. */
  path: string
  /** What the header calls it. */
  title: string
  /** Where the header's back button goes — the page it was opened from. */
  back: string
  /**
   * The section it opens INSIDE on a big screen (`SplitView`, from lg): the
   * desktop header then reads "Funds / Wallet" with no back button, since
   * the list it came from is still beside it. Phones keep the back button.
   */
  splitIn?: string
}

/**
 * Screens reached from inside a section rather than from the nav. The header
 * gives them a title and a round back button (after the design reference)
 * instead of the avatar; the nav keeps their parent highlighted.
 */
export const SUB_PAGES: SubPage[] = [
  { path: '/profile/settings', title: 'Profile settings', back: '/profile', splitIn: 'Profile' },
  { path: '/profile/income-split', title: 'Income split', back: '/profile', splitIn: 'Profile' },
  { path: '/profile/export', title: 'Export data', back: '/profile', splitIn: 'Profile' },
  // One wallet's and one allocation's own page (2026-11-11), back to their tab.
  {
    path: '/funds/wallets/:walletId',
    title: 'Wallet',
    back: '/funds?tab=wallets',
    splitIn: 'Funds',
  },
  {
    path: '/funds/allocations/:fundId',
    title: 'Allocation',
    back: '/funds?tab=allocations',
    splitIn: 'Funds',
  },
  // One debt in full. `:debtId` stands for any one segment — see `matchSubPage`.
  { path: '/debts/:debtId', title: 'Debt', back: '/debts', splitIn: 'Debts' },
  // One due date of one bill.
  { path: '/upcoming/:expenseId/:dueDate', title: 'Upcoming expense', back: '/upcoming' },
  // One note's expenses or income; the tab, note and range are in the query.
  { path: '/analytics/note', title: 'Analytics', back: '/analytics' },
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
