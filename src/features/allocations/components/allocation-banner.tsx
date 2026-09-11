import { ChartPie, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

import { cn } from '@/lib/utils'

import { useAllocation } from '../hooks/use-allocation'

/**
 * A shortcut to the allocation from elsewhere in the app — the dark pill of
 * the design reference ("New insights available · See details"), saying what
 * the allocation is today and opening it.
 *
 * `from` is where the allocation page's back button should return to; without
 * it, back goes to the allocation's own parent, Profile.
 */
export function AllocationBanner({ from, className }: { from?: string; className?: string }) {
  const { rules, isLoading } = useAllocation()

  if (isLoading) {
    return null
  }

  // Paired with the commented-out summary line below — uncomment both together.
  // const summary =
  //   rules.length === 0
  //     ? 'Split every income into your funds automatically'
  //     : `${rules.map((rule) => `${rule.fund_name} ${rule.percentage}%`).join(' · ')}`

  return (
    <Link
      to="/profile/income-split"
      state={from ? { from } : undefined}
      className={cn(
        'flex items-center gap-3 rounded-full bg-secondary py-2 pr-3 pl-2 text-secondary-foreground transition-colors hover:bg-secondary/90 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
        className,
      )}
    >
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-secondary-foreground/15">
        <ChartPie className="size-4" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">
          {rules.length === 0 ? 'Set up your income split' : 'Income split'}
        </span>
        {/* <span className="block truncate text-xs text-secondary-foreground/70">{summary}</span> */}
      </span>
      <span className="flex shrink-0 items-center gap-0.5 text-xs text-secondary-foreground/70">
        {rules.length === 0 ? 'Set up' : 'Edit'}
        <ChevronRight className="size-3.5" aria-hidden="true" />
      </span>
    </Link>
  )
}
