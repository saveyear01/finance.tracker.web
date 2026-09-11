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

import { useArchiveFund } from '../hooks/use-mutate-fund'
import type { Fund } from '../types'

export function ArchiveFundDrawer({
  fund,
  onOpenChange,
}: {
  /** The fund being archived, or null when the drawer is shut. */
  fund: Fund | null
  onOpenChange: (open: boolean) => void
}) {
  const archiveFund = useArchiveFund()

  const dismiss = (next: boolean) => {
    if (!next) {
      archiveFund.reset()
    }
    onOpenChange(next)
  }

  return (
    <Drawer open={fund !== null} onOpenChange={dismiss} showSwipeHandle>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Archive allocation?</DrawerTitle>
          <DrawerDescription>
            {fund && (
              <>
                <span className="font-medium text-foreground">{fund.name}</span> will be
                hidden from your allocations. Its history is kept, and you can restore it any
                time from “Show archived”.
              </>
            )}
          </DrawerDescription>
        </DrawerHeader>

        <div className="p-4">
          {archiveFund.isError && (
            <Alert variant="destructive">
              <AlertDescription>{getApiErrorMessage(archiveFund.error)}</AlertDescription>
            </Alert>
          )}
        </div>

        <DrawerFooter className="pt-0">
          <Button
            variant="destructive"
            size="lg"
            className="h-11"
            disabled={archiveFund.isPending}
            onClick={() =>
              fund && archiveFund.mutate(fund.id, { onSuccess: () => dismiss(false) })
            }
          >
            {archiveFund.isPending && <Loader2 className="animate-spin" />}
            {archiveFund.isPending ? 'Archiving…' : 'Archive'}
          </Button>
          <Button variant="outline" size="lg" className="h-11" onClick={() => dismiss(false)}>
            Cancel
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
