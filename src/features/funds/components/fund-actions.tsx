import { Archive, ArchiveRestore, Pencil } from 'lucide-react'
import { toast } from 'sonner'

import { ActionMenu, type ActionMenuItem } from '@/components/action-menu'
import { getApiErrorMessage } from '@/lib/api-client'

import { useRestoreFund, useSetFundInTotal } from '../hooks/use-mutate-fund'
import { archiveBlockedReason, canArchive } from '../lib/fund-meta'
import type { Fund } from '../types'

/**
 * Per-fund menu — an action sheet on a phone, a dropdown on a wider screen.
 * Every active fund has "Count in total" — a checkbox item
 * (a switch in the sheet) that says whether Home's balance card adds this one in (in the menu, not
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

  const items: ActionMenuItem[] = fund.archived_at
    ? [
        {
          kind: 'action',
          label: 'Restore',
          icon: ArchiveRestore,
          onSelect: restore,
          disabled: restoreFund.isPending,
        },
      ]
    : [
        {
          kind: 'toggle',
          label: 'Count in total',
          hint: "Home's balance card",
          checked: fund.in_total,
          onCheckedChange: toggleInTotal,
          disabled: setInTotal.isPending,
        },
        ...(fund.is_unallocated
          ? []
          : ([
              { kind: 'separator' },
              { kind: 'action', label: 'Rename', icon: Pencil, onSelect: () => onEdit(fund) },
              {
                kind: 'action',
                label: 'Archive',
                icon: Archive,
                destructive: true,
                disabled: !canArchive(fund),
                hint: blockedReason ?? undefined,
                onSelect: () => onArchive(fund),
              },
            ] satisfies ActionMenuItem[])),
      ]

  return <ActionMenu label={`Actions for ${fund.name}`} title={fund.name} items={items} />
}
