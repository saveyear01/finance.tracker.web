import { toast } from 'sonner'

import { ConfirmDialog } from '@/components/confirm-dialog'
import { getApiErrorMessage } from '@/lib/api-client'

import { useDeleteUpcoming } from '../hooks/use-upcoming'
import type { UpcomingExpense } from '../types'

/** Confirm deleting a bill — every due date of it, not just one month's. A
 * modal, not a drawer: confirmations are the one exception (2026-11-13). */
export function DeleteUpcomingDialog({
  expense,
  onOpenChange,
  onDeleted,
}: {
  /** The bill being deleted, or null when the dialog is shut. */
  expense: UpcomingExpense | null
  onOpenChange: (open: boolean) => void
  /** Called once it's gone — a due date's own page leaves for the list,
   * since every due date went with the bill. */
  onDeleted?: () => void
}) {
  const remove = useDeleteUpcoming()

  const close = (next: boolean) => {
    if (!next) remove.reset()
    onOpenChange(next)
  }

  return (
    <ConfirmDialog
      open={expense !== null}
      onOpenChange={close}
      title={expense && `Delete ${expense.name}?`}
      description={
        <>
          {expense?.recurrence === 'none'
            ? 'It stops showing up.'
            : 'Every future due date goes with it.'}{' '}
          No money moves: payments you already made stay in your activity.
        </>
      }
      pending={remove.isPending}
      error={remove.isError ? getApiErrorMessage(remove.error) : null}
      onConfirm={() =>
        expense &&
        remove.mutate(expense.id, {
          onSuccess: () => {
            toast.success(`${expense.name} deleted.`)
            close(false)
            onDeleted?.()
          },
        })
      }
    />
  )
}
