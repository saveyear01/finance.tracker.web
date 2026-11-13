import { ChevronRight, TriangleAlert } from 'lucide-react'
import { Link } from 'react-router-dom'

import { formatMoney } from '@/lib/money'

import type { Fund } from '../types'

/**
 * Shown on Home only while an allocation is below zero (added 2026-11-11).
 * An expense is never refused for lack of funds (decided 2026-10-05) — it
 * takes the allocation negative, borrowing against it — and this is where
 * that gets noticed, rather than only in red on the Funds page.
 */
export function OverdrawnNotice({ funds }: { funds: Fund[] }) {
  const below = funds.filter((fund) => Number(fund.balance) < 0)
  if (below.length === 0) return null

  const [first] = below
  const title =
    below.length === 1
      ? `${first.name} is −${formatMoney(-Number(first.balance))}`
      : `${below.length} allocations are below zero`
  const detail =
    below.length === 1
      ? 'Spent past what it held. Income into it brings it back.'
      : below.map((fund) => `${fund.name} −${formatMoney(-Number(fund.balance))}`).join(' · ')

  return (
    <Link
      to="/allocations"
      className="flex items-center gap-3 rounded-xl bg-destructive/10 px-4 py-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <TriangleAlert className="size-4 shrink-0 text-destructive" aria-hidden="true" />
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-destructive">{title}</span>
        <span className="block text-xs text-foreground">{detail}</span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-destructive" aria-hidden="true" />
    </Link>
  )
}
