import { CirclePlus, Landmark, Pencil, Percent, Trash2, Wallet } from 'lucide-react'

import { EmptyState } from '@/components/layouts/empty-state'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { getApiErrorMessage } from '@/lib/api-client'
import { formatMoney } from '@/lib/money'

import { useDebt } from '../hooks/use-debts'
import { formatRate, formatTerm, progressOf, RATE_KIND_LABELS, shortDate } from '../lib/debt-meta'
import type { Debt } from '../types'

type Action = {
  key: string
  label: string
  icon: typeof Wallet
  onClick: () => void
  /** Left out once there is nothing left to pay. */
  hidden?: boolean
}

/** One figure of the breakdown. */
function Figure({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={muted ? 'tabular-nums text-muted-foreground' : 'font-medium tabular-nums'}>
        {value}
      </span>
    </div>
  )
}

/**
 * One debt in full: what it owes and why, everything you can do to it, and
 * every payment made against it.
 *
 * "The numbers" is the debt's arithmetic in the order it happens: what was
 * borrowed, the interest the term adds to it, anything charged since, and so
 * what is owed in total — then what has been paid off that, and the terms
 * themselves. Lines that would say nothing are left out: a debt with no
 * interest and no charges owes exactly what was borrowed, and repeating that
 * as a total only invites the reader to look for the difference.
 *
 * The list is only a list — each row opens this — so all the actions live
 * here, on the card, in the shape Home's balance card uses. Delete sits apart
 * at the bottom: it should never be a neighbour of Pay.
 *
 * Payments are shown newest first — the API sends them oldest first, which is
 * the right order for a ledger and the wrong one for a page you open to see
 * what just happened. Each is a real expense: it is edited or deleted in the
 * activity, and deleting it there owes the money again here.
 */
export function DebtDetail({
  id,
  onPay,
  onCharge,
  onRates,
  onEdit,
  onDelete,
}: {
  id: string | undefined
  onPay: (debt: Debt) => void
  onCharge: (debt: Debt) => void
  onRates: (debt: Debt) => void
  onEdit: (debt: Debt) => void
  onDelete: (debt: Debt) => void
}) {
  const { debt, isLoading, isError, error } = useDebt(id)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-56 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
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
  const charged = Number(debt.charged) > 0
  const hasInterest = Number(debt.interest) > 0

  const actions: Action[] = [
    { key: 'pay', label: 'Pay', icon: Wallet, onClick: () => onPay(debt), hidden: !open },
    { key: 'charge', label: 'Add', icon: CirclePlus, onClick: () => onCharge(debt) },
    { key: 'rates', label: 'Interest', icon: Percent, onClick: () => onRates(debt) },
    { key: 'edit', label: 'Edit', icon: Pencil, onClick: () => onEdit(debt) },
  ].filter((action) => !action.hidden)

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-xl bg-secondary text-secondary-foreground">
        <div className="bg-primary px-5 py-2 text-xs font-medium text-primary-foreground">
          {[debt.lender, open ? 'Still to pay' : 'Paid off'].filter(Boolean).join(' · ')}
        </div>

        <div className="px-5 pt-4 pb-5">
          <p className="text-lg font-medium">{debt.name}</p>
          <p className="mt-1 text-4xl font-semibold tracking-tight tabular-nums">
            {formatMoney(open ? debt.remaining : debt.paid)}
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
              className="h-full rounded-full bg-secondary-foreground"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2 text-sm opacity-80">
            {formatMoney(debt.paid)} of {formatMoney(debt.owed)} paid · {progress}%
          </p>

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
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-4 text-card-foreground">
        <h2 className="mb-1 font-semibold">The numbers</h2>
        <div className="divide-y divide-border">
          <Figure
            label={`Borrowed ${shortDate(debt.opened_on)}`}
            value={formatMoney(debt.principal)}
          />
          {hasInterest && (
            <Figure label={`Interest over ${term}`} value={formatMoney(debt.interest)} />
          )}
          {charged && <Figure label="Added since" value={formatMoney(debt.charged)} />}
          {(hasInterest || charged) && (
            <Figure label="Owed in total" value={formatMoney(debt.owed)} />
          )}
          <Figure label="Paid" value={formatMoney(debt.paid)} />
          <Figure label="Left to pay" value={formatMoney(debt.remaining)} />
          <Figure
            label={RATE_KIND_LABELS[debt.rate_kind]}
            value={rate ?? 'None'}
            muted={debt.current_rate === null}
          />
          <Figure label="Term" value={term ?? 'Open-ended'} muted={term === null} />
          {debt.monthly_payment && (
            <Figure label="Monthly payment" value={formatMoney(debt.monthly_payment)} />
          )}
          {debt.minimum_payment && (
            <Figure label="Minimum payment" value={formatMoney(debt.minimum_payment)} />
          )}
        </div>
        {debt.note && <p className="mt-3 text-sm text-muted-foreground">{debt.note}</p>}
      </section>

      {charged && (
        <section className="space-y-2">
          <h2 className="font-semibold">Added to this debt</h2>
          <ul className="space-y-2">
            {debt.charges.map((charge) => (
              <li
                key={charge.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 text-card-foreground"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
                  <CirclePlus className="size-4" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{charge.note ?? 'Added to debt'}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {shortDate(charge.charged_on)}
                  </p>
                </div>
                <span className="shrink-0 font-semibold tabular-nums">
                  +{formatMoney(charge.amount)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-2">
        <h2 className="font-semibold">Payments</h2>
        {debt.payments.length === 0 ? (
          <EmptyState
            icon={Landmark}
            title="No payments yet"
            description="Paying records a real expense from a wallet, and brings this debt down."
          />
        ) : (
          <ul className="space-y-2">
            {[...debt.payments].reverse().map((payment) => (
              <li
                key={payment.group_id}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 text-card-foreground"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-success/10 text-success">
                  <Wallet className="size-4" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{shortDate(payment.paid_on)}</p>
                  <p className="truncate text-xs text-muted-foreground">In your activity</p>
                </div>
                {/* Not green: `--success` means money IN, and this money went
                    out of a wallet — it reads red in the activity, and must
                    not read as the opposite here. The tinted icon carries the
                    "progress on the debt" cue instead. */}
                <span className="shrink-0 font-semibold tabular-nums">
                  −{formatMoney(payment.amount)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Apart from the rest on purpose: never a neighbour of Pay. */}
      <div className="pt-2">
        <Button variant="outline" className="w-full text-destructive" onClick={() => onDelete(debt)}>
          <Trash2 />
          Delete debt
        </Button>
      </div>
    </div>
  )
}
