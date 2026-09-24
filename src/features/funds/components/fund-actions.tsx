import { Archive, ArchiveRestore, EllipsisVertical, Pencil } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getApiErrorMessage } from '@/lib/api-client'

import { useRestoreFund, useSetFundInTotal } from '../hooks/use-mutate-fund'
import { archiveBlockedReason, canArchive } from '../lib/fund-meta'
import type { Fund } from '../types'

/**
 * Per-fund menu. Every active fund has "Count in total" — a checkbox item
 * that says whether Home's balance card adds this one in (in the menu, not
 * a switch in the row: the user's call, 2026-09-24). Unallocated gets only
 * that: it can be neither renamed nor archived, and a menu of disabled items
 * is noise. Other funds can also be renamed and archived — but only when
 * empty and not in the allocation; otherwise the archive item stays visible
 * but disabled, with the reason. An archived fund can only be restored.
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
  const setInTotal = useSetFundInTotal()

  const blockedReason = archiveBlockedReason(fund)

  const toggleInTotal = (checked: boolean) =>
    setInTotal.mutate(
      { id: fund.id, in_total: checked },
      {
        onSuccess: () =>
          toast.success(
            checked
              ? `${fund.name} now counts in your total.`
              : `${fund.name} left out of your total.`,
          ),
        onError: (error) => toast.error(getApiErrorMessage(error)),
      },
    )

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
              <DropdownMenuCheckboxItem
                checked={fund.in_total}
                onCheckedChange={toggleInTotal}
                disabled={setInTotal.isPending}
              >
                <span className="flex flex-col">
                  Count in total
                  <span className="text-xs text-muted-foreground">Home's balance card</span>
                </span>
              </DropdownMenuCheckboxItem>
              {!fund.is_unallocated && (
                <>
                  <DropdownMenuSeparator />
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
            </>
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
