import { EllipsisVertical, type LucideIcon } from 'lucide-react'
import { useId, useState, type ReactElement } from 'react'

import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Switch } from '@/components/ui/switch'
import { useIsCompact } from '@/hooks/use-compact'
import { cn } from '@/lib/utils'

export type ActionMenuItem =
  | {
      kind: 'action'
      label: string
      icon?: LucideIcon
      onSelect: () => void
      disabled?: boolean
      destructive?: boolean
      /** A second line: why it's disabled, or what it affects. */
      hint?: string
    }
  | {
      kind: 'toggle'
      label: string
      checked: boolean
      onCheckedChange: (checked: boolean) => void
      disabled?: boolean
      hint?: string
    }
  | { kind: 'separator' }

/**
 * A row's ⋮ menu. On a phone (below `lg`) it opens an action sheet — a
 * bottom drawer titled with what it acts on, full-width 48px rows, a toggle
 * as a switch that stays open so the change is seen; on a wider screen, the
 * ordinary dropdown. Put the destructive action last, as the sheet reads
 * top to bottom toward it.
 *
 * The trigger is drawn small (it sits in a card's corner) but its hit area
 * is padded out to 44px.
 */
export function ActionMenu({
  label,
  title,
  items,
}: {
  /** The trigger's accessible name: "Actions for BPI". */
  label: string
  /** The sheet's title — the thing acted on. */
  title: string
  items: ActionMenuItem[]
}) {
  const compact = useIsCompact()
  const trigger = (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={label}
      className="relative after:absolute after:-inset-2 after:content-['']"
    />
  )

  if (!compact) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger render={trigger}>
          <EllipsisVertical />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuGroup>
            {items.map((item, index) => {
              if (item.kind === 'separator') return <DropdownMenuSeparator key={index} />
              const body = (
                <span className="flex flex-col">
                  {item.label}
                  {item.hint && <span className="text-xs text-muted-foreground">{item.hint}</span>}
                </span>
              )
              if (item.kind === 'toggle') {
                return (
                  <DropdownMenuCheckboxItem
                    key={index}
                    checked={item.checked}
                    onCheckedChange={item.onCheckedChange}
                    disabled={item.disabled}
                  >
                    {body}
                  </DropdownMenuCheckboxItem>
                )
              }
              const Icon = item.icon
              return (
                <DropdownMenuItem
                  key={index}
                  variant={item.destructive ? 'destructive' : 'default'}
                  disabled={item.disabled}
                  onClick={item.onSelect}
                >
                  {Icon && <Icon />}
                  {body}
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return <ActionSheet trigger={trigger} title={title} items={items} />
}

function ActionSheet({
  trigger,
  title,
  items,
}: {
  trigger: ReactElement
  title: string
  items: ActionMenuItem[]
}) {
  const [open, setOpen] = useState(false)
  const baseId = useId()

  return (
    <Drawer open={open} onOpenChange={setOpen} showSwipeHandle>
      <DrawerTrigger render={trigger}>
        <EllipsisVertical />
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{title}</DrawerTitle>
        </DrawerHeader>
        <ul className="space-y-0.5 px-2 pt-2 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
          {items.map((item, index) => {
            if (item.kind === 'separator') {
              return <li key={index} role="separator" className="mx-3 my-1.5 h-px bg-border" />
            }
            const hint = item.hint && (
              <span className="block text-xs font-normal text-muted-foreground">{item.hint}</span>
            )
            if (item.kind === 'toggle') {
              const labelId = `${baseId}-${index}`
              return (
                <li key={index}>
                  <label className="flex min-h-12 w-full items-center gap-3 rounded-lg px-3 py-2 text-base has-disabled:opacity-50">
                    <span id={labelId} className="min-w-0 flex-1">
                      {item.label}
                      {hint}
                    </span>
                    <Switch
                      checked={item.checked}
                      onCheckedChange={item.onCheckedChange}
                      disabled={item.disabled}
                      aria-labelledby={labelId}
                    />
                  </label>
                </li>
              )
            }
            const Icon = item.icon
            return (
                <li key={index}>
                  <button
                    type="button"
                    disabled={item.disabled}
                    onClick={() => {
                      setOpen(false)
                      item.onSelect()
                    }}
                    className={cn(
                      'flex min-h-12 w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-base transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 active:bg-muted disabled:pointer-events-none disabled:opacity-50',
                      item.destructive && 'text-destructive',
                    )}
                  >
                    {Icon && <Icon className="size-5 shrink-0" aria-hidden="true" />}
                    <span className="min-w-0 flex-1">
                      {item.label}
                      {hint}
                    </span>
                  </button>
                </li>
            )
          })}
        </ul>
      </DrawerContent>
    </Drawer>
  )
}
