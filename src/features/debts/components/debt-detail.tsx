import { useState, type ReactNode } from 'react'
import {
  Check,
  ChevronRight,
  CirclePlus,
  Minus,
  Pencil,
  Percent,
  Plus,
  Sparkle,
  Wallet,
} from 'lucide-react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { localToday, TransactionDrawer, useTransactionGroup } from '@/features/transactions'
import { getApiErrorMessage } from '@/lib/api-client'
import { formatMoney } from '@/lib/money'
import { cn } from '@/lib/utils'

import { useDebt, useDebts } from '../hooks/use-debts'
import {
  centsOf,
  formatRate,
  formatTerm,
  longDate,
  monthYearAfter,
  paceOf,
  progressOf,
  RATE_KIND_LABELS,
  shortDate,
  standingOf,
} from '../lib/debt-meta'
import type { Debt, DebtCharge, DebtRate } from '../types'

type Action = { key: string; label: string; icon: typeof Wallet; onClick: () => void }

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`

/** A label and its value, as rows of a card. */
function Rows({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="divide-y divide-border text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-baseline justify-between gap-3 py-2">
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="text-right font-medium tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

type SumLine = { op: '' | '+' | '−' | '='; label: string; detail?: string; value: string }

/**
 * The debt's arithmetic, read as a sum: borrowed, + interest, + what was
 * added, − paid, = what's left. Lines that would add nothing are left out.
 * Each row is ONE grid — operator, label, figure — so the three share a
 * baseline however the label wraps.
 */
function Breakdown({ debt }: { debt: Debt }) {
  const lines: SumLine[] = [
    { op: '', label: 'Borrowed', detail: longDate(debt.opened_on), value: debt.principal },
  ]
  if (centsOf(debt.interest) > 0) {
    lines.push({
      op: '+',
      label: 'Interest',
      detail: `${formatRate(debt.current_rate)} × ${plural(debt.tenure_months ?? 0, 'month')}, flat`,
      value: debt.interest,
    })
  }
  if (centsOf(debt.charged) > 0) {
    lines.push({
      op: '+',
      label: 'Added since',
      detail: plural(debt.charges.length, 'charge'),
      value: debt.charged,
    })
  }
  lines.push(
    {
      op: '−',
      label: 'Paid',
      detail: debt.payments.length > 0 ? plural(debt.payments.length, 'payment') : undefined,
      value: debt.paid,
    },
    { op: '=', label: 'Left to pay', value: debt.remaining },
  )

  return (
    <dl className="text-sm">
      {lines.map((line) => {
        const total = line.op === '='
        return (
          <div
            key={line.label}
            className={cn(
              'grid grid-cols-[1rem_minmax(0,1fr)_auto] items-baseline gap-x-2 py-2',
              total ? 'border-t-[1.5px] border-foreground' : 'not-first:border-t border-border',
            )}
          >
            <span aria-hidden="true" className="text-center font-bold text-muted-foreground">
              {line.op}
            </span>
            <dt className={total ? 'font-semibold' : 'text-muted-foreground'}>
              {line.label}
              {line.detail && <span className="block text-xs">{line.detail}</span>}
            </dt>
            <dd className={cn('tabular-nums', total ? 'font-bold' : 'font-medium')}>
              {formatMoney(line.value)}
            </dd>
          </div>
        )
      })}
    </dl>
  )
}

/**
 * Everything about where the debt is going, in ONE card (2026-11-13, mockup
 * `design/debts-minimal.html` — it replaced Schedule, Pace and Terms, which
 * said the monthly payment three times): each number once.
 *
 * - a debt with a term: next due (date and amount), how far behind, the
 *   rate, and when it ends;
 * - an open-ended one (a card): the minimum asked, how long that takes at
 *   this pace, the rate, "No end date";
 * - the agreed note, if any.
 *
 * Under them, "How it adds up" folds the arithmetic away — borrowed +
 * interest + added − paid = left — for when you want it.
 */
function PlanCard({ debt }: { debt: Debt }) {
  const today = localToday()
  const rate = formatRate(debt.current_rate)
  const rows: [string, ReactNode][] = []
  const schedule = debt.schedule

  if (schedule && debt.monthly_payment && debt.tenure_months) {
    if (schedule.next_due) rows.push(['Next due', `${shortDate(schedule.next_due)} · ${formatMoney(debt.monthly_payment)}`])
    if (centsOf(schedule.behind) > 0) {
      rows.push(['Behind by', <span key="behind" className="text-destructive">{formatMoney(schedule.behind)}</span>])
    }
  } else {
    const { monthsAtMinimum } = paceOf(debt, today)
    if (debt.minimum_payment) {
      rows.push(['Minimum', `${formatMoney(debt.minimum_payment)} a month`])
      if (monthsAtMinimum !== null) {
        rows.push(['At the minimum', `~${plural(monthsAtMinimum, 'month')} · ${monthYearAfter(today, monthsAtMinimum)}`])
      }
    }
  }
  rows.push(['Rate', rate ? `${rate} · ${RATE_KIND_LABELS[debt.rate_kind].toLowerCase()}` : 'No interest'])
  rows.push([
    'Ends',
    schedule && debt.tenure_months ? `${longDate(schedule.ends_on)} · ${formatTerm(debt.tenure_months)}` : 'No end date',
  ])

  return (
    <section className="card-surface text-card-foreground">
      <div className="space-y-1 p-4 pb-2">
        <h2 className="font-semibold">Plan</h2>
        <Rows rows={rows} />
        {debt.note && <p className="pb-2 text-sm text-muted-foreground">{debt.note}</p>}
      </div>
      <details className="group border-t border-border">
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold text-primary outline-none focus-visible:bg-muted/60 [&::-webkit-details-marker]:hidden">
          How it adds up
          <ChevronRight className="size-4 transition-transform group-open:rotate-90" aria-hidden="true" />
        </summary>
        <div className="px-4 pb-3">
          <Breakdown debt={debt} />
        </div>
      </details>
    </section>
  )
}

type HistoryItem =
  | { kind: 'payment'; date: string; key: string; groupId: string; amount: string }
  | { kind: 'charge'; date: string; key: string; charge: DebtCharge }
  | { kind: 'rate'; date: string; key: string; rate: DebtRate }
  | { kind: 'start'; date: string; key: string }

/**
 * Everything that happened to the debt, newest first, in one timeline:
 * payments, charges, rate changes and the day it started. The opening rate
 * is told on the "Started" line rather than as a change of its own.
 */
function historyOf(debt: Debt): HistoryItem[] {
  const items: HistoryItem[] = [
    ...debt.payments.map((payment) => ({
      kind: 'payment' as const,
      date: payment.paid_on,
      key: `p${payment.group_id}`,
      groupId: payment.group_id,
      amount: payment.amount,
    })),
    ...debt.charges.map((charge) => ({
      kind: 'charge' as const,
      date: charge.charged_on,
      key: `c${charge.id}`,
      charge,
    })),
    ...debt.rates
      .filter((rate) => rate.effective_from !== debt.opened_on)
      .map((rate) => ({ kind: 'rate' as const, date: rate.effective_from, key: `r${rate.id}`, rate })),
  ]
  // Newest first.
  items.sort((a, b) => b.date.localeCompare(a.date))
  return [...items, { kind: 'start', date: debt.opened_on, key: 'start' }]
}

function HistoryRow({
  icon: Icon,
  tone = 'muted',
  title,
  detail,
  amount,
  onClick,
}: {
  icon: typeof Wallet
  tone?: 'pay' | 'charge' | 'muted'
  title: string
  detail: string
  amount?: ReactNode
  onClick?: () => void
}) {
  const body = (
    <>
      <span
        className={cn(
          'grid size-8 place-items-center rounded-full',
          tone === 'pay' && 'bg-primary/10 text-primary',
          tone === 'charge' && 'bg-destructive/10 text-destructive',
          tone === 'muted' && 'bg-muted text-muted-foreground',
        )}
        aria-hidden="true"
      >
        <Icon className="size-4" />
      </span>
      <span className="min-w-0">
        <span className="block font-medium break-words">{title}</span>
        <span className="block text-xs text-muted-foreground">{detail}</span>
      </span>
      <span className="text-right font-semibold tabular-nums">{amount}</span>
      {onClick ? (
        <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
      ) : (
        <span />
      )}
    </>
  )
  const layout = 'grid w-full grid-cols-[2rem_minmax(0,1fr)_auto_1rem] items-center gap-3 px-4 py-2.5 text-left'
  return (
    <li className="border-border not-first:border-t">
      {onClick ? (
        <button
          type="button"
          onClick={onClick}
          className={cn(
            layout,
            'transition-colors outline-none hover:bg-muted/60 focus-visible:bg-muted/60',
          )}
        >
          {body}
        </button>
      ) : (
        <div className={layout}>{body}</div>
      )}
    </li>
  )
}

/** A payment's expense, opened in the activity's own drawer — Edit and
 * Delete there are the real ones, and deleting owes the money again. */
function PaymentDrawer({ groupId, onClose }: { groupId: string | null; onClose: () => void }) {
  const { legs } = useTransactionGroup(groupId)
  return (
    <TransactionDrawer
      entry={groupId ? (legs[0] ?? null) : null}
      onOpenChange={(open) => !open && onClose()}
    />
  )
}

/**
 * One debt in full, minimal since 2026-11-13 (mockup
 * `design/debts-minimal.html` — the user found it overwhelming), each number
 * said once:
 *
 * - the dark card: what's left, one bar with "% paid", where it stands
 *   ("19 payments behind"), its rank in the household's priority, and every
 *   action;
 * - Plan: next due, how far behind, rate, when it ends (a card: the minimum
 *   and how long it takes), with "How it adds up" folded under it. A
 *   paid-off debt shows the sum instead, open;
 * - History: one timeline of payments, charges and rate changes. A payment
 *   opens its expense, a charge opens to be corrected or deleted, a rate
 *   change opens Interest.
 *
 * Delete is quiet text at the bottom, never a neighbour of Pay.
 *
 * Beside the list on a big screen the pane is wide enough to pair Plan and
 * History, and to put the actions at the card's right. CONTAINER queries,
 * gated on `lg`: the pane's width decides, and a tablet's single column must
 * stay the phone layout.
 */
export function DebtDetail({
  id,
  onPay,
  onCharge,
  onEditCharge,
  onRates,
  onEdit,
  onDelete,
}: {
  id: string | undefined
  onPay: (debt: Debt) => void
  onCharge: (debt: Debt) => void
  onEditCharge: (debt: Debt, charge: DebtCharge) => void
  onRates: (debt: Debt) => void
  onEdit: (debt: Debt) => void
  onDelete: (debt: Debt) => void
}) {
  const { debt, isLoading, isError, error } = useDebt(id)
  const { debts } = useDebts()
  const [payment, setPayment] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-64 w-full rounded-xl lg:h-48" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    )
  }

  if (isError || !debt) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {isError ? getApiErrorMessage(error) : "That debt doesn't exist."}
        </AlertDescription>
      </Alert>
    )
  }

  const open = debt.status === 'open'
  const progress = progressOf(debt)
  const standing = standingOf(debt)
  const openDebts = debts.filter((row) => row.status === 'open')
  const rank = openDebts.findIndex((row) => row.id === debt.id) + 1
  const lastPayment = debt.payments.at(-1)
  const history = historyOf(debt)

  const actions: Action[] = [
    ...(open ? [{ key: 'pay', label: 'Pay', icon: Wallet, onClick: () => onPay(debt) }] : []),
    { key: 'charge', label: 'Add charge', icon: CirclePlus, onClick: () => onCharge(debt) },
    ...(open ? [{ key: 'rates', label: 'Interest', icon: Percent, onClick: () => onRates(debt) }] : []),
    { key: 'edit', label: 'Edit', icon: Pencil, onClick: () => onEdit(debt) },
  ]

  const heading = [debt.lender, open && rank > 0 && `Priority ${rank} of ${openDebts.length}`]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="@container space-y-4">
      <section className="rounded-xl bg-secondary px-5 pt-4 pb-5 text-secondary-foreground lg:@xl:grid lg:@xl:grid-cols-[minmax(0,1fr)_auto] lg:@xl:items-end lg:@xl:gap-6 lg:@xl:py-5">
        {/* One cell, so the hero's text stays one column beside the actions. */}
        <div className="min-w-0">
          {open ? (
            <>
              {heading && <p className="text-sm opacity-85">{heading}</p>}
              <p className="mt-1 text-lg font-medium break-words">{debt.name}</p>
              <p className="mt-2 figure-xl">
                {formatMoney(debt.remaining)}
                <span className="ml-1.5 text-sm font-medium tracking-normal opacity-75">left</span>
              </p>

              <div
                className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-secondary-foreground/15"
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${debt.name} paid off`}
              >
                <div
                  className="h-full rounded-full bg-secondary-accent"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="opacity-85">{progress}% paid</span>
                <span
                  className={cn(
                    'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold',
                    standing.tone === 'bad' && 'bg-secondary-negative/20 text-secondary-negative',
                    standing.tone === 'good' && 'bg-secondary-accent/15 text-secondary-accent',
                    standing.tone === 'neutral' && 'bg-secondary-foreground/10',
                  )}
                >
                  {standing.label}
                </span>
              </div>
            </>
          ) : (
            <div className="grid justify-items-center gap-1 py-2 text-center">
              <span className="grid size-12 place-items-center rounded-full bg-secondary-accent/20 text-secondary-accent">
                <Check className="size-6" aria-hidden="true" />
              </span>
              <p className="mt-1 text-lg font-medium break-words">{debt.name}</p>
              <p className="figure-lg">Paid off</p>
              <p className="text-sm opacity-85">
                {formatMoney(debt.paid)} paid
                {lastPayment && ` · cleared ${longDate(lastPayment.paid_on)}`}
              </p>
            </div>
          )}
        </div>

        {/* Wide, a row of fixed-width buttons (flex ignores the inline grid
            template); narrow, they share the card's width evenly. */}
        <ul
          className="mt-5 grid gap-2 lg:@xl:mt-0 lg:@xl:flex"
          style={{ gridTemplateColumns: `repeat(${actions.length}, minmax(0, 1fr))` }}
        >
          {actions.map(({ key, label, icon: Icon, onClick }) => (
            <li key={key} className="lg:@xl:w-18">
              <button
                type="button"
                onClick={onClick}
                className="group flex w-full flex-col items-center gap-1.5 rounded-xl py-1 text-xs outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <span className="grid size-11 place-items-center rounded-full bg-secondary-foreground/15 transition-colors group-hover:bg-secondary-foreground/25">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                {label}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <div className="flex flex-col gap-4 lg:@2xl:grid lg:@2xl:grid-cols-2 lg:@2xl:items-start">
        {open ? (
          <PlanCard debt={debt} />
        ) : (
          <section className="space-y-2 card-surface p-4 text-card-foreground">
            <h2 className="font-semibold">How it added up</h2>
            <Breakdown debt={debt} />
          </section>
        )}

        <section className="card-surface text-card-foreground">
          <h2 className="px-4 pt-4 pb-1 font-semibold">History</h2>
          <ul>
            {history.map((item) => {
              switch (item.kind) {
                case 'payment':
                  return (
                    <HistoryRow
                      key={item.key}
                      icon={Minus}
                      tone="pay"
                      title="Payment"
                      detail={shortDate(item.date)}
                      amount={`−${formatMoney(item.amount)}`}
                      onClick={() => setPayment(item.groupId)}
                    />
                  )
                case 'charge':
                  return (
                    <HistoryRow
                      key={item.key}
                      icon={Plus}
                      tone="charge"
                      title={item.charge.note ?? 'Charge'}
                      detail={`${shortDate(item.date)} · charge`}
                      amount={<span className="text-destructive">+{formatMoney(item.charge.amount)}</span>}
                      onClick={() => onEditCharge(debt, item.charge)}
                    />
                  )
                case 'rate':
                  return (
                    <HistoryRow
                      key={item.key}
                      icon={Percent}
                      title={`Rate set to ${formatRate(item.rate.monthly_rate)}`}
                      detail={shortDate(item.date)}
                      onClick={() => onRates(debt)}
                    />
                  )
                case 'start':
                  return (
                    <HistoryRow
                      key={item.key}
                      icon={Sparkle}
                      title="Started"
                      detail={[
                        longDate(item.date),
                        formatMoney(debt.principal),
                        debt.rates[0]?.effective_from === debt.opened_on &&
                          `at ${formatRate(debt.rates[0].monthly_rate)}`,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    />
                  )
              }
            })}
          </ul>
          {debt.payments.length === 0 && (
            <p className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
              No payments yet. Paying records a real expense from a wallet, and brings this debt down.
            </p>
          )}
        </section>
      </div>

      {/* Apart from the rest on purpose: never a neighbour of Pay. */}
      <div className="flex justify-center pt-1 lg:@xl:justify-start">
        <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={() => onDelete(debt)}>
          Delete debt
        </Button>
      </div>

      <PaymentDrawer groupId={payment} onClose={() => setPayment(null)} />
    </div>
  )
}
