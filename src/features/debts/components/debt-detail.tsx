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
  Trash2,
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

/** A card of the page: a heading, an optional figure or link beside it. */
function Card({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="space-y-3 card-surface p-4 text-card-foreground">
      <h2 className="flex items-baseline justify-between gap-3">
        <span className="font-semibold">{title}</span>
        {aside && <span className="text-xs text-muted-foreground">{aside}</span>}
      </h2>
      {children}
    </section>
  )
}

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
 * A debt with a term, against it: a bar of what's paid with a marker at
 * what should be by now, then the next due date, how many have fallen due
 * and when it ends. Measured against the loan (principal + interest) —
 * charges sit on top of the schedule.
 */
function ScheduleCard({ debt }: { debt: Debt }) {
  const schedule = debt.schedule
  if (!schedule || !debt.monthly_payment || !debt.tenure_months) return null
  const loan = centsOf(debt.principal) + centsOf(debt.interest)
  const pct = (cents: number) => (loan > 0 ? Math.min(100, (cents / loan) * 100) : 0)
  const paidPct = pct(centsOf(debt.paid))
  const duePct = pct(centsOf(schedule.due_so_far))

  return (
    <Card title="Schedule" aside={`${formatMoney(debt.monthly_payment)} a month`}>
      <div
        className="relative h-2.5 rounded-full bg-muted"
        role="img"
        aria-label={`${formatMoney(debt.paid)} paid; ${formatMoney(schedule.due_so_far)} due by now`}
      >
        <div className="h-full rounded-full bg-primary" style={{ width: `${paidPct}%` }} />
        {schedule.due_count > 0 && (
          <span
            className="absolute -top-1 -bottom-1 w-0.5 -translate-x-1/2 rounded-full bg-foreground"
            style={{ left: `${duePct}%` }}
            aria-hidden="true"
          />
        )}
      </div>
      <p className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <i className="size-2.5 rounded-sm bg-primary" aria-hidden="true" />
          Paid <b className="font-semibold text-foreground tabular-nums">{formatMoney(debt.paid)}</b>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="h-2.5 w-0.5 rounded-sm bg-foreground" aria-hidden="true" />
          Due by now{' '}
          <b className="font-semibold text-foreground tabular-nums">
            {formatMoney(schedule.due_so_far)}
          </b>
        </span>
      </p>
      <Rows
        rows={[
          ...(schedule.next_due
            ? ([['Next due', `${shortDate(schedule.next_due)} · ${formatMoney(debt.monthly_payment)}`]] as [
                string,
                ReactNode,
              ][])
            : []),
          ['Due so far', `${schedule.due_count} of ${plural(debt.tenure_months, 'payment')}`],
          ['Ends', longDate(schedule.ends_on)],
        ]}
      />
    </Card>
  )
}

/** An open-ended debt has nothing to keep up with, so: how fast it's going. */
function PaceCard({ debt }: { debt: Debt }) {
  const today = localToday()
  const { monthsAtMinimum, recentCents } = paceOf(debt, today)
  const rows: [string, ReactNode][] = []
  if (monthsAtMinimum !== null && debt.minimum_payment) {
    rows.push([
      `At the ${formatMoney(debt.minimum_payment)} minimum`,
      `~${plural(monthsAtMinimum, 'month')} · ${monthYearAfter(today, monthsAtMinimum)}`,
    ])
  }
  rows.push(['Paid in the last 3 months', formatMoney(recentCents / 100)])
  return (
    <Card title="Pace" aside="No term to follow">
      <Rows rows={rows} />
      <p className="text-xs text-muted-foreground">
        Interest the lender bills goes in as a charge. Without a term, nothing works it out ahead.
      </p>
    </Card>
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
 * One debt in full, laid out top to bottom as the questions come:
 *
 * - the dark card: what's left, how far through, where it stands against
 *   its schedule, its rank in the household's priority, and every action;
 * - Schedule (a debt with a term: next due, due so far, when it ends) or
 *   Pace (an open-ended one: how long the minimum takes);
 * - Breakdown, the arithmetic as a sum, and Terms, what it was agreed at;
 * - History: one timeline of payments, charges and rate changes. A payment
 *   opens its expense, a charge opens to be corrected or deleted, a rate
 *   change opens Interest.
 *
 * Delete sits apart at the bottom: it should never be a neighbour of Pay.
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
        <Skeleton className="h-64 w-full rounded-xl" />
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
  const rate = formatRate(debt.current_rate)
  const term = formatTerm(debt.tenure_months)
  const standing = standingOf(debt)
  const openDebts = debts.filter((row) => row.status === 'open')
  const rank = openDebts.findIndex((row) => row.id === debt.id) + 1
  const lastPayment = debt.payments.at(-1)
  const history = historyOf(debt)
  const entries = history.length - 1

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
    <div className="space-y-4">
      <section className="rounded-xl bg-secondary px-5 pt-4 pb-5 text-secondary-foreground">
        {open ? (
          <>
            {heading && <p className="text-sm opacity-85">{heading}</p>}
            <p className="mt-1 text-lg font-medium break-words">{debt.name}</p>
            <p className="mt-1 figure-xl">{formatMoney(debt.remaining)}</p>
            <p className="text-sm opacity-85">left to pay</p>

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
            <p className="mt-2 text-sm opacity-85">
              {formatMoney(debt.paid)} of {formatMoney(debt.owed)} paid · {progress}%
            </p>
            <p
              className={cn(
                'mt-3 inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold',
                standing.tone === 'bad' && 'bg-destructive/35 text-secondary-foreground',
                standing.tone === 'good' && 'bg-secondary-accent/15 text-secondary-accent',
                standing.tone === 'neutral' && 'bg-secondary-foreground/10',
              )}
            >
              {standing.label}
              {standing.tone === 'bad' &&
                debt.schedule &&
                centsOf(debt.schedule.behind) >= centsOf(debt.monthly_payment ?? '0') &&
                ` · ${formatMoney(debt.schedule.behind)}`}
            </p>
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

        <ul
          className="mt-5 grid gap-2"
          style={{ gridTemplateColumns: `repeat(${actions.length}, minmax(0, 1fr))` }}
        >
          {actions.map(({ key, label, icon: Icon, onClick }) => (
            <li key={key}>
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

      {open && (debt.schedule ? <ScheduleCard debt={debt} /> : <PaceCard debt={debt} />)}

      <Card title="Breakdown">
        <Breakdown debt={debt} />
      </Card>

      <Card
        title="Terms"
        aside={
          <button
            type="button"
            onClick={() => onRates(debt)}
            className="rounded-md text-sm font-semibold text-primary outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            Interest ›
          </button>
        }
      >
        <Rows
          rows={[
            [RATE_KIND_LABELS[debt.rate_kind], rate ?? 'None'],
            ['Term', term ?? 'Open-ended'],
            ...(debt.monthly_payment
              ? ([['Monthly payment', formatMoney(debt.monthly_payment)]] as [string, ReactNode][])
              : []),
            ...(debt.minimum_payment
              ? ([['Minimum asked', formatMoney(debt.minimum_payment)]] as [string, ReactNode][])
              : []),
            ['Started', longDate(debt.opened_on)],
          ]}
        />
        {debt.note && <p className="text-sm text-muted-foreground">{debt.note}</p>}
      </Card>

      <section className="space-y-2">
        <h2 className="flex items-baseline justify-between gap-3 px-0.5">
          <span className="text-sm font-semibold">History</span>
          <span className="text-xs text-muted-foreground">
            {entries} {entries === 1 ? 'entry' : 'entries'}
          </span>
        </h2>
        <ul className="overflow-hidden card-surface text-card-foreground">
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
          <p className="px-0.5 text-xs text-muted-foreground">
            No payments yet. Paying records a real expense from a wallet, and brings this debt down.
          </p>
        )}
      </section>

      {/* Apart from the rest on purpose: never a neighbour of Pay. */}
      <div className="pt-2">
        <Button variant="outline" className="w-full text-destructive" onClick={() => onDelete(debt)}>
          <Trash2 />
          Delete debt
        </Button>
      </div>

      <PaymentDrawer groupId={payment} onClose={() => setPayment(null)} />
    </div>
  )
}
