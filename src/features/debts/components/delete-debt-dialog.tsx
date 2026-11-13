import { toast } from 'sonner'

import { ConfirmDialog } from '@/components/confirm-dialog'
import { getApiErrorMessage } from '@/lib/api-client'
import { formatMoney } from '@/lib/money'

import { useDeleteDebt } from '../hooks/use-debts'
import type { Debt } from '../types'

/** Confirm deleting a debt — it, its rate history and its charges. A modal,
 * not a drawer: confirmations are the one exception (2026-11-13). */
export function DeleteDebtDialog({
  debt,
  onOpenChange,
  onDeleted,
}: {
  /** The debt being deleted, or null when the dialog is shut. */
  debt: Debt | null
  onOpenChange: (open: boolean) => void
  /** Called once it's gone — the debt's own page leaves for the list, since
   * staying would show a debt that no longer exists. */
  onDeleted?: () => void
}) {
  const remove = useDeleteDebt()

  const close = (next: boolean) => {
    if (!next) remove.reset()
    onOpenChange(next)
  }

  return (
    <ConfirmDialog
      open={debt !== null}
      onOpenChange={close}
      title={debt && `Delete ${debt.name}?`}
      description={
        <>
          {/* In money: nothing moves — a debt is an obligation, not a balance. */}
          {debt && Number(debt.remaining) > 0
            ? `The ${formatMoney(debt.remaining)} still owed stops being tracked. No money moves. `
            : 'No money moves. '}
          Its rate history and charges go too; payments you made stay in your activity.
        </>
      }
      pending={remove.isPending}
      error={remove.isError ? getApiErrorMessage(remove.error) : null}
      onConfirm={() =>
        debt &&
        remove.mutate(debt.id, {
          onSuccess: () => {
            toast.success(`${debt.name} deleted.`)
            close(false)
            onDeleted?.()
          },
        })
      }
    />
  )
}
