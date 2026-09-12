import { toast } from 'sonner'

import { ActionDrawer, localToday, type ExpenseInput } from '@/features/transactions'
import { formatMoney } from '@/lib/money'

import { usePayDebt } from '../hooks/use-debts'
import type { Debt } from '../types'

/** A stored amount as the keypad would have typed it: "1500", "1500.50". */
function asTyped(amount: string): string {
  const cents = Math.round(Number(amount) * 100)
  return cents % 100 === 0 ? String(cents / 100) : (cents / 100).toFixed(2)
}

/**
 * Pay towards a debt — with the very expense form Home records expenses in
 * (`ActionDrawer`, through its `via` option), so the two can never drift
 * apart: wallet, fund, the keypad, note and date, and the same "only what's
 * there can be spent" checks.
 *
 * It starts on what a month of the debt costs — the term's monthly payment,
 * else the lender's minimum — and on what's left when neither applies or the
 * debt is nearly settled. Paying less just leaves the rest owed. The note
 * defaults to the debt's name, which is how the expense reads in the
 * activity.
 */
export function PayDebtDrawer({
  debt,
  onOpenChange,
}: {
  /** The debt being paid, or null when the drawer is shut. */
  debt: Debt | null
  onOpenChange: (open: boolean) => void
}) {
  const pay = usePayDebt()

  // What a month of this debt costs: the term's own payment where there is
  // one, else the lender's minimum. Only worth offering while it is less than
  // what is left — on the last payment, what is left IS the amount.
  const scheduled = debt?.monthly_payment ?? debt?.minimum_payment ?? null
  const due =
    debt && scheduled &&
    Math.round(Number(scheduled) * 100) < Math.round(Number(debt.remaining) * 100)
      ? scheduled
      : null

  const via = debt && {
    title: `Pay ${debt.name}`,
    description:
      `${formatMoney(debt.remaining)} left of ${formatMoney(debt.owed)}. ` +
      (due
        ? `Starts on the ${formatMoney(due)} due each month — pay more to clear it sooner.`
        : "Paying less than what's left leaves the rest owed."),
    submitLabel: 'Pay',
    amount: asTyped(due ?? debt.remaining),
    notePlaceholder: debt.name,
    mutation: pay,
    submit: (input: ExpenseInput) =>
      pay.mutate(
        { id: debt.id, input: { ...input, date: input.date ?? localToday() } },
        {
          onSuccess: (result) => {
            toast.success(
              result.status === 'paid_off'
                ? `${debt.name} paid off.`
                : `${formatMoney(input.amount)} paid · ${formatMoney(result.remaining)} of ${debt.name} left.`,
            )
            onOpenChange(false)
          },
        },
      ),
  }

  return <ActionDrawer action={debt ? 'expense' : null} via={via} onOpenChange={onOpenChange} />
}
