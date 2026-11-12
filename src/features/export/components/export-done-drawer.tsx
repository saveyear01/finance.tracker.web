import { Check } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'

import { saveFile, type ExportedFile } from '../api/export-api'
import { PARTS, describeWindow, type ExportPart, type ExportWindow } from '../lib/export-options'

/**
 * After a download: what was saved, so it can be checked before opening it —
 * and a way to save it again if the browser's own prompt was dismissed.
 */
export function ExportDoneDrawer({
  done,
  onOpenChange,
}: {
  /** The file just saved and what went in it, or null when shut. */
  done: { file: ExportedFile; parts: ExportPart[]; range: ExportWindow } | null
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Drawer open={done !== null} onOpenChange={onOpenChange} showSwipeHandle>
      <DrawerContent>
        <DrawerHeader>
          <span className="mx-auto mb-1 grid size-12 place-items-center rounded-full bg-accent text-accent-foreground md:mx-0">
            <Check className="size-5" aria-hidden="true" />
          </span>
          <DrawerTitle>Export downloaded</DrawerTitle>
          <DrawerDescription>
            {done && `${describeWindow(done.range)} · saved to your downloads`}
          </DrawerDescription>
        </DrawerHeader>

        {done && (
          <div className="px-4 pb-4">
            <div className="divide-y divide-border overflow-hidden rounded-xl border border-border">
              <p className="px-3 py-2.5 font-mono text-xs break-all">{done.file.filename}</p>
              {PARTS.filter((part) => done.parts.includes(part.value)).map((part) => (
                <p key={part.value} className="px-3 py-2 text-sm text-muted-foreground">
                  {part.label}
                </p>
              ))}
            </div>
          </div>
        )}

        <DrawerFooter className="pt-0">
          <Button size="lg" className="h-11" onClick={() => onOpenChange(false)}>
            Done
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="h-11"
            onClick={() => done && saveFile(done.file)}
          >
            Save again
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
