import { format } from 'date-fns'
import { ChartColumn, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Skeleton } from '@/components/ui/skeleton'
import { localToday } from '@/features/transactions'
import { useIsCompact } from '@/hooks/use-compact'
import { formatMoney } from '@/lib/money'
import { cn } from '@/lib/utils'

import { useSummary } from '../hooks/use-analytics'
import { fromIso, monthOf } from '../lib/ranges'

const cents = (amount: string | undefined) => Math.round(Number(amount ?? 0) * 100)

/**
 * Home's pulse on the month (minimal since 2026-11-13, mockup
 * `design/home-minimal.html`): a few figures, each said once — what was
 * spent TODAY (the user asked for it on Home), money in and money out so
 * far; from lg also what was kept. No chart (the user's call — Analytics
 * has them). The header opens
 * Analytics on this same month, where the notes and the rest live. Reads
 * the same queries the Analytics page does, so opening it is instant.
 */
export function MonthSoFar() {
  const compact = useIsCompact()
  const month = monthOf(new Date()).window
  const income = useSummary('income', month)
  const expense = useSummary('expense', month)

  if (!income.data || !expense.data) {
    if (income.isError || expense.isError) return null
    return <Skeleton className="h-32 w-full rounded-xl" />
  }

  const today = localToday()
  const received = cents(income.data.total)
  const spent = cents(expense.data.total)
  const spentToday = cents(expense.data.days.find((day) => day.date === today)?.total)
  const kept = received - spent
  const title = `${format(fromIso(month.start), 'MMMM')} so far`

  const figures = [
    { label: 'Spent today', cents: spentToday, sign: spentToday > 0 ? '−' : '', className: '' },
    { label: 'In', cents: received, sign: received > 0 ? '+' : '', className: received > 0 ? 'text-success' : '' },
    { label: 'Out', cents: spent, sign: spent > 0 ? '−' : '', className: spent > 0 ? 'text-destructive' : '' },
    ...(compact
      ? []
      : [{ label: 'Kept', cents: Math.abs(kept), sign: kept < 0 ? '−' : '', className: kept < 0 ? 'text-destructive' : '' }]),
  ]

  return (
    <section className="space-y-3 card-surface p-4 text-card-foreground" aria-labelledby="month-heading">
      <Link
        to="/analytics"
        className="-m-1 flex items-center justify-between rounded-md p-1 text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <h2 id="month-heading">{title}</h2>
        <span className="inline-flex items-center gap-0.5">
          {!compact && 'Analytics'}
          <ChevronRight className="size-4" aria-hidden="true" />
        </span>
      </Link>

      {received === 0 && spent === 0 ? (
        <Quiet lastExpense={expense.data.last_before} lastIncome={income.data.last_before} />
      ) : (
        <>
          <dl className={cn('grid gap-3', compact ? 'grid-cols-3' : 'grid-cols-4')}>
            {figures.map((figure) => (
              <div key={figure.label} className="min-w-0">
                <dt className="text-xs text-muted-foreground">{figure.label}</dt>
                <dd className={cn('truncate font-semibold tabular-nums lg:text-lg', figure.className)}>
                  {figure.sign}
                  {formatMoney(figure.cents / 100)}
                </dd>
              </div>
            ))}
          </dl>
        </>
      )}
    </section>
  )
}

/** A month with nothing in it yet: when there last was. */
function Quiet({ lastExpense, lastIncome }: { lastExpense: string | null; lastIncome: string | null }) {
  const day = (value: string) => format(fromIso(value), 'MMM d')
  const parts = [
    lastExpense && `your last expense was on ${day(lastExpense)}`,
    lastIncome && `your last income on ${day(lastIncome)}`,
  ].filter(Boolean)
  const detail = parts.length > 0 ? `${parts.join(', ')}.` : 'What you record shows up here.'

  return (
    <div className="flex items-center gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-muted" aria-hidden="true">
        <ChartColumn className="size-4 text-muted-foreground" />
      </span>
      <p className="text-sm text-muted-foreground">
        <span className="block font-medium text-foreground">Nothing recorded yet this month</span>
        {detail.charAt(0).toUpperCase() + detail.slice(1)}
      </p>
    </div>
  )
}
