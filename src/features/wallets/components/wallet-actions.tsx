import { Archive, ArchiveRestore, Pencil } from 'lucide-react'
import { toast } from 'sonner'

import { ActionMenu, type ActionMenuItem } from '@/components/action-menu'
import { getApiErrorMessage } from '@/lib/api-client'

import { useRestoreWallet } from '../hooks/use-mutate-wallet'
import { canArchive } from '../lib/wallet-meta'
import type { Wallet } from '../types'

/**
 * Per-wallet menu — an action sheet on a phone, a dropdown on a wider screen.
 *
 * An active wallet can be edited and — only when empty — archived. The
 * archive item stays visible but disabled otherwise, with the reason, so the
 * rule is discoverable rather than a missing option. An archived wallet can
 * only be restored.
 */
export function WalletActions({
  wallet,
  onEdit,
  onArchive,
}: {
  wallet: Wallet
  onEdit: (wallet: Wallet) => void
  onArchive: (wallet: Wallet) => void
}) {
  const restoreWallet = useRestoreWallet()

  const restore = () =>
    restoreWallet.mutate(wallet.id, {
      onSuccess: () => toast.success(`${wallet.name} restored.`),
      onError: (error) => toast.error(getApiErrorMessage(error)),
    })

  const items: ActionMenuItem[] = wallet.archived_at
    ? [
        {
          kind: 'action',
          label: 'Restore',
          icon: ArchiveRestore,
          onSelect: restore,
          disabled: restoreWallet.isPending,
        },
      ]
    : [
        { kind: 'action', label: 'Edit', icon: Pencil, onSelect: () => onEdit(wallet) },
        {
          kind: 'action',
          label: 'Archive',
          icon: Archive,
          destructive: true,
          disabled: !canArchive(wallet),
          hint: canArchive(wallet) ? undefined : 'Only empty wallets',
          onSelect: () => onArchive(wallet),
        },
      ]

  return <ActionMenu label={`Actions for ${wallet.name}`} title={wallet.name} items={items} />
}
