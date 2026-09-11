import { EllipsisVertical, Pencil, Trash2, Undo2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import type { UpcomingExpense } from '../types'

/**
 * Per-row menu: edit the bill, or delete it — and, on a skipped due date,
 * undo the skip.
 */
export function UpcomingActions({
  expense,
  onEdit,
  onDelete,
  onUndoSkip,
}: {
  expense: UpcomingExpense
  onEdit: (expense: UpcomingExpense) => void
  onDelete: (expense: UpcomingExpense) => void
  /** Given only for a skipped due date. */
  onUndoSkip?: () => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${expense.name}`} />
        }
      >
        <EllipsisVertical />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuGroup>
          {onUndoSkip && (
            <DropdownMenuItem onClick={onUndoSkip}>
              <Undo2 />
              Undo skip
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => onEdit(expense)}>
            <Pencil />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={() => onDelete(expense)}>
            <Trash2 />
            Delete
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
