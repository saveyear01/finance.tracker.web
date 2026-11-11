import { format } from 'date-fns'
import { ChartColumn, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Skeleton } from '@/components/ui/skeleton'
import { formatMoney } from '@/lib/money'
import { cn } from '@/lib/utils'

import { useNoteTotals, useSummary } from '../hooks/use-analytics'
import { fromIso, monthOf, noteLabel } from '../lib/ranges'

const cents = (amount: string | undefined) => Math.round(Number(amount ?? 0) * 100)

/**
 * Home's pulse on the month (added 2026-11-11): money in against money out
 * so far, what was kept, and where most of it went — the three biggest
 * notes. The way in to Analytics, which opens on this same month. Reads the
 * same queries the Analytics page does, so opening it is instant.
 */
export function MonthSoFar() {
  const month = monthOf(new Date()).window
  const income = useSummary('income', month)
  const expense = useSummary('expense', month)
  const notes = useNoteTotals('expense', month)

  if (!income.data || !expense.data) {
    if (income.isError || expense.isError) return null
    return <Skeleton className="h-40 w-full rounded-xl" />
  }

  const received = cents(income.data.total)
  const spent = cents(expense.data.total)
  const kept = received - spent
  const max = Math.max(received, spent, 1)
  const top = (notes.data?.notes ?? []).filter((note) => note.note !== null).slice(0, 3)
  const title = `${format(fromIso(month.start), 'MMMM')} so far`

  const rows = [
    { label: 'Received', cents: received, className: 'bg-success' },
    { label: 'Spent', cents: spent, className: 'bg-(--series-1)' },
  ]

  return (
    <section className="space-y-3 card-surface p-4 text-card-foreground" aria-labelledby="month-heading">
      <div className="flex items-baseline justify-between gap-2">
        <h2 id="month-heading" className="text-sm font-semibold">
          {title}
        </h2>
        <Link
          to="/analytics"
          className="inline-flex items-center gap-0.5 text-sm font-medium text-primary hover:underline"
        >
          Analytics
          <ChevronRight className="size-4" aria-hidden="true" />
        </Link>
      </div>

      {received === 0 && spent === 0 ? (
        <Quiet lastExpense={expense.data.last_before} lastIncome={income.data.last_before} />
      ) : (
        <>
          <dl className="space-y-2">
            {rows.map((row) => (
              <div key={row.label} className="grid grid-cols-[4.5rem_1fr_auto] items-center gap-2.5 text-sm">
                <dt className="text-muted-foreground">{row.label}</dt>
                <span className="h-2 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                  {row.cents > 0 && (
                    <i
                      className={cn('block h-full rounded-full', row.className)}
                      style={{ width: `${Math.max(2, (row.cents / max) * 100)}%` }}
                    />
                  )}
                </span>
                <dd className="font-semibold tabular-nums">{formatMoney(row.cents / 100)}</dd>
              </div>
            ))}
          </dl>

          {top.length > 0 && (
            <ul className="flex flex-wrap gap-1.5" aria-label="Biggest expenses by note">
              {top.map((note) => (
                <li key={note.note} className="rounded-full bg-muted px-2.5 py-1 text-xs">
                  {noteLabel(note.note)}{' '}
                  <span className="font-semibold tabular-nums">{formatMoney(note.total)}</span>
                </li>
              ))}
            </ul>
          )}

          <p className="flex items-baseline justify-between gap-3 border-t border-border pt-3 text-sm">
            <span className="text-muted-foreground">{kept >= 0 ? 'You kept' : 'You spent more than came in'}</span>
            <span className={cn('font-semibold tabular-nums', kept >= 0 ? 'text-success' : 'text-destructive')}>
              {kept >= 0 ? '+' : '−'}
              {formatMoney(Math.abs(kept) / 100)}
              {kept >= 0 && received > 0 && ` · ${Math.round((kept / received) * 100)}%`}
            </span>
          </p>
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
