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

import { useRestoreWallet } from '../hooks/use-mutate-wallet'
import { canArchive } from '../lib/wallet-meta'
import type { Wallet } from '../types'

/**
 * Per-wallet menu.
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Actions for ${wallet.name}`}
          />
        }
      >
        <EllipsisVertical />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuGroup>
          {wallet.archived_at ? (
            <DropdownMenuItem disabled={restoreWallet.isPending} onClick={restore}>
              <ArchiveRestore />
              Restore
            </DropdownMenuItem>
          ) : (
            <>
              <DropdownMenuItem onClick={() => onEdit(wallet)}>
                <Pencil />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                disabled={!canArchive(wallet)}
                onClick={() => onArchive(wallet)}
              >
                <Archive />
                <span className="flex flex-col">
                  Archive
                  {!canArchive(wallet) && (
                    <span className="text-xs text-muted-foreground">
                      Only empty wallets
                    </span>
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
