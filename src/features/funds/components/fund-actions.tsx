import { Archive, ArchiveRestore, EllipsisVertical, Pencil } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getApiErrorMessage } from '@/lib/api-client'

import { useRestoreFund } from '../hooks/use-mutate-fund'
import { archiveBlockedReason, canArchive } from '../lib/fund-meta'
import type { Fund } from '../types'

/**
 * Per-fund menu. Unallocated gets none — it can be neither renamed nor
 * archived, and a menu of disabled items is noise. Other funds can be renamed
 * and archived — but only when empty and not in the allocation; otherwise the
 * archive item stays visible but disabled, with the reason. An archived fund
 * can only be restored.
 */
export function FundActions({
  fund,
  onEdit,
  onArchive,
}: {
  fund: Fund
  onEdit: (fund: Fund) => void
  onArchive: (fund: Fund) => void
}) {
  const restoreFund = useRestoreFund()

  if (fund.is_unallocated) {
    return null
  }

  const blockedReason = archiveBlockedReason(fund)

  const restore = () =>
    restoreFund.mutate(fund.id, {
      onSuccess: () => toast.success(`${fund.name} restored.`),
      onError: (error) => toast.error(getApiErrorMessage(error)),
    })

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${fund.name}`} />
        }
      >
        <EllipsisVertical />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuGroup>
          {fund.archived_at ? (
            <DropdownMenuItem disabled={restoreFund.isPending} onClick={restore}>
              <ArchiveRestore />
              Restore
            </DropdownMenuItem>
          ) : (
            <>
              <DropdownMenuItem onClick={() => onEdit(fund)}>
                <Pencil />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                disabled={!canArchive(fund)}
                onClick={() => onArchive(fund)}
              >
                <Archive />
                <span className="flex flex-col">
                  Archive
                  {blockedReason && (
                    <span className="text-xs text-muted-foreground">{blockedReason}</span>
                  )}
                </span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
