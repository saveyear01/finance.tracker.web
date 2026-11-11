import { useMemo } from 'react'
import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

import { fundColors, useFunds } from '@/features/funds'
import { cn } from '@/lib/utils'

import { useAllocation } from '../hooks/use-allocation'

/** "Wants", "Wants and Savings", "Wants, Savings and Emergency". */
function list(names: string[]): string {
  return names.length <= 1 ? (names[0] ?? '') : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`
}

/**
 * The income split at a glance, on the Allocations tab (2026-11-11 — it was
 * a dark bar that said "Income split" and nothing about the split): a bar of
 * the shares in each allocation's own colour, the same colours its rows and
 * the wallets' bars wear, and the split in words. The whole card opens the
 * editor.
 *
 * `from` is where the editor's back button should return to; without it,
 * back goes to the editor's own parent, Profile.
 */
export function AllocationBanner({ from, className }: { from?: string; className?: string }) {
  const { rules, isLoading } = useAllocation()
  const { funds } = useFunds()
  const colors = useMemo(() => fundColors(funds), [funds])

  if (isLoading) return null

  const words =
    rules.length === 0
      ? 'Income stays in Unallocated until you split it. Set a split and every income divides itself.'
      : `New income goes ${list(rules.map((rule) => `${rule.percentage}% to ${rule.fund_name}`))}.`

  return (
    <Link
      to="/profile/income-split"
      state={from ? { from } : undefined}
      className={cn(
        'block space-y-2.5 rounded-xl bg-secondary px-4 py-3.5 text-secondary-foreground transition-colors outline-none hover:bg-secondary/90 focus-visible:ring-3 focus-visible:ring-ring/50',
        className,
      )}
    >
      <span className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-semibold">Income split</span>
        <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-secondary-accent">
          {rules.length === 0 ? 'Set up' : 'Edit'}
          <ChevronRight className="size-3.5" aria-hidden="true" />
        </span>
      </span>
      {rules.length > 0 && (
        <span className="flex h-1.5 gap-px overflow-hidden rounded-full bg-secondary-foreground/15" aria-hidden="true">
          {rules.map((rule) => (
            <i
              key={rule.fund_id}
              className="block h-full"
              style={{ width: `${rule.percentage}%`, backgroundColor: colors.get(rule.fund_id) }}
            />
          ))}
        </span>
      )}
      <span className="block text-xs text-secondary-foreground/80">{words}</span>
    </Link>
  )
}
