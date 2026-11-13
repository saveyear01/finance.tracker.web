import {
  CalendarCheck,
  CalendarRange,
  CircleSlash,
  Pencil,
  Trash2,
  Undo2,
  Wallet,
} from 'lucide-react'
import { toast } from 'sonner'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { localToday } from '@/features/transactions'
import { getApiErrorMessage } from '@/lib/api-client'
import { formatMoney } from '@/lib/money'
import { cn } from '@/lib/utils'

import { useOccurrence, useSkipUpcoming, useUndoSkip } from '../hooks/use-upcoming'
import { RECURRENCE_LABELS, shortDate, statusOf, whenText, type RowStatus } from '../lib/upcoming-meta'
import type { Occurrence, UpcomingExpense } from '../types'

/** The line under the name — where the bill stands, in days. */
const WHEN_TONE: Record<RowStatus, string> = {
  paid: 'font-semibold text-success',
  skipped: 'text-muted-foreground',
  overdue: 'font-semibold text-destructive',
  partial: 'text-muted-foreground',
  due: 'text-muted-foreground',
  ended: 'text-muted-foreground',
}

/**
 * The date tile's own colour — the page's one strong note, and the thing
 * that tells you where the bill stands before you have read a word of it.
 * Navy while it is simply coming, red once it is late, green once it's done.
 *
 * `primary-foreground` is the white both `primary` and `destructive` pair
 * with; `--success` has no foreground of its own, and this is that same white
 * rather than a value invented here.
 */
const TILE_TONE: Record<RowStatus, string> = {
  paid: 'bg-success text-primary-foreground',
  skipped: 'bg-muted text-muted-foreground',
  overdue: 'bg-destructive text-destructive-foreground',
  partial: 'bg-secondary text-secondary-foreground',
  due: 'bg-secondary text-secondary-foreground',
  ended: 'bg-muted text-muted-foreground',
}

/** "2026-09-19" → { month: "SEP", day: "19" }, read as a local date. */
function tileParts(isoDate: string): { month: string; day: string } {
  const [year, month, day] = isoDate.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return {
    month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
    day: String(day),
  }
}

/**
 * One due date of one bill, in full: where it stands, everything that can be
 * done to it, and every payment made towards it.
 *
 * Laid out to look like its own module rather than the debts page in
 * different words, while staying in the same theme. A debt is a BALANCE, so
 * it gets the dark hero card; an upcoming expense is a DATE, so it leads with
 * a calendar tile — the navy concentrated into that tile instead of a whole
 * card, and coloured by where the bill stands.
 *
 * Everything about the bill lives in that one card. Breaking the figures out
 * into stat cards of their own gave the page several boxes of equal weight
 * and nothing to look at first.
 *
 * The payments are the reason this page exists. A bill can be paid in
 * instalments — a partial payment leaves the rest due and the bill's own
 * amount never moves — so they are drawn as a timeline: what "staggered"
 * actually looks like, and nothing like the debts page's plain rows.
 *
 * A BUDGET (whole month) is the same page for a month instead of a day: the
 * tile shows the month over a calendar-range mark, the figures say spent and
 * left to spend, and there is no Skip — once its month is over it just ends.
 *
 * Skip is offered only on an overdue date (a bill still to come is paid or
 * left alone) and turns into Undo once skipped. Delete sits apart at
 * the bottom: it removes the whole bill, not this one date.
 */
export function UpcomingDetail({
  id,
  dueDate,
  onPay,
  onEdit,
  onDelete,
}: {
  id: string | undefined
  dueDate: string | undefined
  onPay: (occurrence: Occurrence) => void
  onEdit: (expense: UpcomingExpense) => void
  onDelete: (expense: UpcomingExpense) => void
}) {
  const { occurrence, isLoading, isError, error } = useOccurrence(id, dueDate)
  const skip = useSkipUpcoming()
  const undo = useUndoSkip()
  const today = localToday()

  if (isLoading) {
    return (
      <div className="space-y-4">
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      )
    }

    if (isError || !occurrence) {
      return (
        <Alert variant="destructive">
          <AlertDescription>
            {isError ? getApiErrorMessage(error) : "That due date doesn't exist."}
          </AlertDescription>
        </Alert>
      )
    }

    const { expense, payments } = occurrence
    const budget = expense.whole_month
    const status = statusOf(occurrence, today)
    const owed = status === 'overdue' || status === 'partial' || status === 'due'
    const paidCents = Math.round(Number(occurrence.paid) * 100)
    const amountCents = Math.round(Number(expense.amount) * 100)
    // Paid past the bill's amount — `remaining` is negative by that much.
    const overCents = status === 'paid' ? Math.max(0, paidCents - amountCents) : 0
    const progress = amountCents > 0 ? Math.min(100, Math.round((paidCents / amountCents) * 100)) : 100
    const tile = tileParts(occurrence.due_date)

    // No confirmation on either: a skip is one tap to undo, from the toast.
    const undoSkip = () =>
      undo.mutate(
        { id: expense.id, dueDate: occurrence.due_date },
        {
          onSuccess: () => toast.success(`${expense.name} is due again.`),
          onError: (err) => toast.error(getApiErrorMessage(err)),
        },
      )
    const skipOne = () =>
      skip.mutate(
        { id: expense.id, dueDate: occurrence.due_date, today },
        {
          onSuccess: () =>
            toast.success(`${expense.name} skipped.`, {
              action: { label: 'Undo', onClick: undoSkip },
            }),
          onError: (err) => toast.error(getApiErrorMessage(err)),
        },
      )

    // From lg the payments sit beside the card rather than under it, so the
    // whole story of the date — where it stands and how it got there — is on
    // one screen. Below lg the same three blocks stack in reading order:
    // card and actions, payments, then delete.
    return (
      <div className="space-y-4 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] lg:items-start lg:gap-x-6 lg:gap-y-4 lg:space-y-0">
        <div className="space-y-4">
        {/* The date leads — what an upcoming expense IS, is a day it falls due
            — and the figure it comes to sits under it, so the page has one
            thing to look at rather than three small boxes of equal weight. */}
        <section className="overflow-hidden card-surface text-card-foreground">
          <div className="flex items-center gap-4 p-4">
            <div
              className={cn(
                'grid size-16 shrink-0 place-items-center rounded-xl',
                TILE_TONE[status],
              )}
            >
              <span className="text-[0.65rem] font-medium tracking-widest opacity-80">
                {tile.month}
              </span>
              {budget ? (
                <CalendarRange className="-mt-1 size-6" aria-label="Whole month" />
              ) : (
                <span className="-mt-1 text-2xl leading-none font-semibold tabular-nums">
                  {tile.day}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-lg font-medium">{expense.name}</p>
              {/* How late, or how soon — the tile beside it already says the day. */}
              <p className={cn('text-sm', WHEN_TONE[status])}>{whenText(occurrence, today)}</p>
              <p className="truncate text-xs text-muted-foreground">
                {budget && 'Budget · '}
                {RECURRENCE_LABELS[expense.recurrence]} · {formatMoney(expense.amount)}
              </p>
            </div>
          </div>

          {/* Paid past the amount: the headline becomes the overrun, negative
              and red — "−₱2,000.00 over budget" is the figure the user wants
              to see, not a total that stops at "paid". */}
          <div className="border-t border-border px-4 py-4">
            <p className="text-xs text-muted-foreground">
              {owed
                ? budget
                  ? 'Left to spend'
                  : 'Still to pay'
                : overCents > 0
                  ? 'Over budget'
                  : status === 'ended'
                    ? 'Spent before it ended'
                    : status === 'paid'
                      ? budget
                        ? 'All spent'
                        : 'Paid in full'
                      : 'Paid before skipping'}
            </p>
            <p
              className={cn(
                'mt-0.5 figure-lg',
                overCents > 0 && 'text-destructive',
              )}
            >
              {overCents > 0
                ? `−${formatMoney(overCents / 100)}`
                : formatMoney(owed ? occurrence.remaining : occurrence.paid)}
            </p>

            {paidCents > 0 && (
              <>
                <div
                  className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted"
                  role="progressbar"
                  aria-valuenow={progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${expense.name} ${budget ? 'spent' : 'paid'}`}
                >
                  <div
                    className={cn(
                      'h-full rounded-full',
                      status === 'paid' ? 'bg-success' : 'bg-primary',
                    )}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {formatMoney(occurrence.paid)} of {formatMoney(expense.amount)} {budget ? 'spent' : 'paid'} ·{' '}
                  {progress}%
                </p>
              </>
            )}
            {paidCents === 0 && (
              <p className="mt-1 text-xs text-muted-foreground">
                {budget ? 'nothing spent yet' : 'nothing paid yet'}
              </p>
            )}
          </div>
        </section>

        {/* Pay is the whole point of the page, so it gets the full width and
            nothing to compete with. The rest sit under it, plainly secondary —
            a row of equal buttons made none of them look like the one to press.
            A paid bill can still be paid — more goes over its amount — so only
            a skipped one loses the button, quieter once paid. */}
        {status !== 'skipped' && (
          <Button
            size="lg"
            variant={owed ? 'default' : 'outline'}
            className="h-12 w-full text-base"
            onClick={() => onPay(occurrence)}
          >
            <Wallet />
            {budget ? 'Record spending' : owed ? 'Pay this bill' : 'Pay more'}
          </Button>
        )}
        <div className="flex gap-2">
          {/* Never on a budget: it isn't late, it ends with its month. */}
          {owed && !budget && occurrence.due_date < today && (
            <Button variant="outline" className="h-11 flex-1" onClick={skipOne}>
              <CircleSlash />
              Skip
            </Button>
          )}
          {status === 'skipped' && (
            <Button variant="outline" className="h-11 flex-1" onClick={undoSkip}>
              <Undo2 />
              Unskip
            </Button>
          )}
          <Button variant="outline" className="h-11 flex-1" onClick={() => onEdit(expense)}>
            <Pencil />
            Edit
          </Button>
        </div>

        {expense.note && (
          <p className="card-surface p-3 text-sm text-muted-foreground">
            {expense.note}
          </p>
        )}
      </div>

      <section className="space-y-3 lg:row-span-2 lg:card-surface lg:p-4 lg:text-card-foreground">
        <h2 className="font-semibold">
          {budget ? 'Spending' : 'Payments'}
          {payments.length > 1 && ` · ${payments.length}`}
        </h2>
        {payments.length === 0 ? (
          <p className="flex items-center gap-2.5 rounded-xl border border-dashed border-border px-3.5 py-3 text-sm text-muted-foreground">
            <CalendarCheck className="size-4 shrink-0" aria-hidden="true" />
            {budget
              ? 'Nothing spent yet. Record each time you spend from it.'
              : 'Nothing paid yet. Paying part of it leaves the rest due.'}
          </p>
        ) : (
          // A timeline, oldest at the top: instalments happen in order, and
          // reading down the line is reading how the bill got paid down.
          <ol className="relative space-y-4 pl-6">
            <span
              className="absolute top-2 bottom-2 left-[0.3125rem] w-px bg-border"
              aria-hidden="true"
            />
            {payments.map((payment, index) => (
              <li key={payment.group_id} className="relative">
                <span
                  className="absolute top-1.5 -left-6 size-2.5 rounded-full bg-primary ring-4 ring-background"
                  aria-hidden="true"
                />
                <div className="flex items-baseline justify-between gap-3">
                  {/* Numbered only when there is more than one — "Payment 1"
                      of one is a count nobody asked for. */}
                  <p className="truncate text-sm font-medium">
                    {payments.length > 1 ? `Payment ${index + 1}` : 'Paid'}
                    <span className="font-normal text-muted-foreground">
                      {' · '}
                      {shortDate(payment.paid_on)}
                    </span>
                  </p>
                  {/* Not green: `--success` means money IN, and this went out
                      of a wallet — it reads red in the activity and must not
                      read as the opposite here. */}
                  <span className="shrink-0 text-sm font-semibold tabular-nums">
                    −{formatMoney(payment.amount)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">In your activity</p>
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* Apart from the rest on purpose: this deletes the whole bill, every
          due date of it, not just the one being looked at. */}
      <div className="pt-2 lg:col-start-1 lg:pt-0">
        <Button
          variant="outline"
          className="w-full text-destructive"
          onClick={() => onDelete(expense)}
        >
          <Trash2 />
          Delete this bill
        </Button>
      </div>
    </div>
  )
}
