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
import { formatMoney } from '@/lib/money'

import { useDeleteDebt } from '../hooks/use-debts'
import type { Debt } from '../types'

/** Confirm deleting a debt — it, its rate history and its charges. */
export function DeleteDebtDrawer({
  debt,
  onOpenChange,
  onDeleted,
}: {
  /** The debt being deleted, or null when the drawer is shut. */
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
    <Drawer open={debt !== null} onOpenChange={close} showSwipeHandle>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{debt && `Delete ${debt.name}?`}</DrawerTitle>
          <DrawerDescription>
            {/* In money: nothing moves — a debt is an obligation, not a balance. */}
            {debt && Number(debt.remaining) > 0
              ? `The ${formatMoney(debt.remaining)} still owed stops being tracked. No money moves. `
              : 'No money moves. '}
            Its rate history and charges go too; payments you made stay in your activity.
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
              debt &&
              remove.mutate(debt.id, {
                onSuccess: () => {
                  toast.success(`${debt.name} deleted.`)
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
