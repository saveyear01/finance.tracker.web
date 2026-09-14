import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { getApiErrorMessage } from '@/lib/api-client'

import { useDeleteUpcoming } from '../hooks/use-upcoming'
import type { UpcomingExpense } from '../types'

/** Confirm deleting a bill — every due date of it, not just one month's. */
export function DeleteUpcomingDrawer({
  expense,
  onOpenChange,
  onDeleted,
}: {
  /** The bill being deleted, or null when the drawer is shut. */
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
    <Drawer open={expense !== null} onOpenChange={close} showSwipeHandle>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{expense && `Delete ${expense.name}?`}</DrawerTitle>
          <DrawerDescription>
            {expense?.recurrence === 'none'
              ? 'It stops showing up.'
              : 'Every future due date goes with it.'}{' '}
            Payments you already made stay in your activity.
          </DrawerDescription>
        </DrawerHeader>

        {remove.isError && (
          <div className="p-4">
            <Alert variant="destructive">
              <AlertDescription>{getApiErrorMessage(remove.error)}</AlertDescription>
            </Alert>
          </div>
        )}

        <DrawerFooter>
          <Button
            variant="destructive"
            size="lg"
            className="h-11"
            disabled={remove.isPending}
            onClick={() =>
              expense &&
              remove.mutate(expense.id, {
                onSuccess: () => {
                  toast.success(`${expense.name} deleted.`)
                  close(false)
                  onDeleted?.()
                },
              })
            }
          >
            {remove.isPending && <Loader2 className="animate-spin" />}
            {remove.isPending ? 'Deleting…' : 'Delete'}
          </Button>
          <Button variant="outline" size="lg" className="h-11" onClick={() => close(false)}>
            Cancel
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
