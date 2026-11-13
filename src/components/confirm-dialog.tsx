import { useRef, type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

/**
 * "Delete X?" — a centred modal on every screen size (2026-11-13), the one
 * kind of overlay that isn't a drawer. Says what happens (in money, where
 * money is involved), then the destructive action first and Cancel.
 *
 * Stays open while the action runs and when it fails, so the API's reason
 * shows in place; the caller closes it on success.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Delete',
  pendingLabel = 'Deleting…',
  pending = false,
  error,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  description: ReactNode
  confirmLabel?: string
  pendingLabel?: string
  pending?: boolean
  /** Why it failed, already worded for the user. */
  error?: string | null
  onConfirm: () => void
}) {
  // Focus lands on Cancel, never on Delete: an Enter pressed out of habit
  // must not be the thing that deletes.
  const cancel = useRef<HTMLButtonElement>(null)

  return (
    <AlertDialog
      open={open}
      // Not mid-request: closing then would hide the result of a delete
      // that may still go through.
      onOpenChange={(next) => !pending && onOpenChange(next)}
    >
      <AlertDialogContent initialFocus={cancel}>
        <div className="grid gap-1.5">
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </div>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="grid gap-2 sm:grid-cols-2">
          <Button
            variant="destructive"
            size="lg"
            className="h-11"
            disabled={pending}
            onClick={onConfirm}
          >
            {pending && <Loader2 className="animate-spin" />}
            {pending ? pendingLabel : confirmLabel}
          </Button>
          <Button
            ref={cancel}
            variant="outline"
            size="lg"
            className="h-11"
            disabled={pending}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
