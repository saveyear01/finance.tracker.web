import { Loader2 } from 'lucide-react'

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

import { useArchiveWallet } from '../hooks/use-mutate-wallet'
import type { Wallet } from '../types'

export function ArchiveWalletDrawer({
  wallet,
  onOpenChange,
}: {
  /** The wallet being archived, or null when the drawer is shut. */
  wallet: Wallet | null
  onOpenChange: (open: boolean) => void
}) {
  const archiveWallet = useArchiveWallet()

  const dismiss = (next: boolean) => {
    if (!next) {
      archiveWallet.reset()
    }
    onOpenChange(next)
  }

  return (
    <Drawer open={wallet !== null} onOpenChange={dismiss} showSwipeHandle>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Archive wallet?</DrawerTitle>
          <DrawerDescription>
            {wallet && (
              <>
                <span className="font-medium text-foreground">{wallet.name}</span>{' '}
                will be hidden from your wallets. Its history is kept, and you
                can restore it any time from “Show archived”.
              </>
            )}
          </DrawerDescription>
        </DrawerHeader>

        <div className="p-4">
          {archiveWallet.isError && (
            <Alert variant="destructive">
              <AlertDescription>{getApiErrorMessage(archiveWallet.error)}</AlertDescription>
            </Alert>
          )}
        </div>

        <DrawerFooter className="pt-0">
          <Button
            variant="destructive"
            size="lg"
            className="h-11"
            disabled={archiveWallet.isPending}
            onClick={() =>
              wallet &&
              archiveWallet.mutate(wallet.id, { onSuccess: () => dismiss(false) })
            }
          >
            {archiveWallet.isPending && <Loader2 className="animate-spin" />}
            {archiveWallet.isPending ? 'Archiving…' : 'Archive'}
          </Button>
          <Button variant="outline" size="lg" className="h-11" onClick={() => dismiss(false)}>
            Cancel
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
