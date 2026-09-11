import { toast } from 'sonner'

import { ActionDrawer, localToday, type ExpenseInput } from '@/features/transactions'
import { formatMoney } from '@/lib/money'

import { usePayUpcoming } from '../hooks/use-upcoming'
import { shortDate } from '../lib/upcoming-meta'
import type { Occurrence } from '../types'

/** A stored amount as the keypad would have typed it: "1500", "1500.50". */
function asTyped(amount: string): string {
  const cents = Math.round(Number(amount) * 100)
  return cents % 100 === 0 ? String(cents / 100) : (cents / 100).toFixed(2)
}

/**
 * Pay towards one due date of a bill — with the very expense form Home
 * records expenses in (`ActionDrawer`, through its `via` option), so the two
 * can never drift apart: wallet, fund, the keypad, note and date, and the
 * same "only what's there can be spent" checks.
 *
 * It starts on what's left to pay; less leaves the rest due (a partial
 * payment — the bill's own amount doesn't change), more is fine too, since
 * bills vary. The note defaults to the bill's name, which is how the expense
 * reads in the activity.
 */
export function PayDrawer({
  occurrence,
  onOpenChange,
}: {
  /** The due date being paid, or null when the drawer is shut. */
  occurrence: Occurrence | null
  onOpenChange: (open: boolean) => void
}) {
  const pay = usePayUpcoming()

  const via = occurrence && {
    title: `Pay ${occurrence.expense.name}`,
    description:
      (Number(occurrence.paid) > 0
        ? `Due ${shortDate(occurrence.due_date)} · ${formatMoney(occurrence.paid)} of ${formatMoney(occurrence.expense.amount)} paid. `
        : `Due ${shortDate(occurrence.due_date)}. `) +
      "Paying less than what's left leaves the rest due.",
    submitLabel: 'Pay',
    amount: asTyped(occurrence.remaining),
    notePlaceholder: occurrence.expense.name,
    mutation: pay,
    submit: (input: ExpenseInput) =>
      pay.mutate(
        {
          id: occurrence.expense.id,
          input: { ...input, due_date: occurrence.due_date, date: input.date ?? localToday() },
        },
        {
          onSuccess: (result) => {
            toast.success(
              result.status === 'partial'
                ? `${formatMoney(input.amount)} paid · ${formatMoney(result.remaining)} of ${occurrence.expense.name} left.`
                : `${occurrence.expense.name} paid.`,
            )
            onOpenChange(false)
          },
        },
      ),
  }

  return (
    <ActionDrawer action={occurrence ? 'expense' : null} via={via} onOpenChange={onOpenChange} />
  )
}
