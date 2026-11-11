import { Check, ChevronDown, Search } from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useIsCompact } from '@/hooks/use-compact'
import { cn } from '@/lib/utils'

export type PickerOption = { value: string; label: string; detail?: string }

/** Past this many options the sheet offers a search box. */
const SEARCH_FROM = 8
const NONE = '__none__'

/**
 * Pick one of a list — a wallet, an allocation. The one way the app asks for
 * a choice from a list that can grow.
 *
 * On a phone (below `lg`) it opens a bottom sheet over whatever it sits in,
 * nested when that is itself a drawer: the field's name as its title, rows
 * a thumb can hit (48px), the detail (a balance) right-aligned, a check on
 * the current choice, and a search box once the list is long. That keeps the
 * app's rule — every overlay is a drawer — and puts the list where the thumb
 * is, instead of a small popover over the form. On a wider screen it is the
 * ordinary Select popover, where a pointer is precise.
 *
 * The value is an id string, '' for none.
 */
export function Picker({
  value,
  onChange,
  options,
  label,
  placeholder,
  invalid = false,
  id,
  clearable = false,
  emptyText = 'Nothing to choose here.',
  className,
}: {
  value: string
  onChange: (value: string) => void
  options: PickerOption[]
  /** The field's name: the trigger's accessible name and the sheet's title. */
  label: string
  placeholder: string
  invalid?: boolean
  id?: string
  /** Offer a first option that sets the field back to none. */
  clearable?: boolean
  emptyText?: string
  className?: string
}) {
  const compact = useIsCompact()
  const current = options.find((option) => option.value === value)

  if (!compact) {
    return (
      <Select
        value={value || null}
        onValueChange={(next) => onChange(next === NONE || next == null ? '' : String(next))}
      >
        <SelectTrigger
          id={id}
          className={cn('h-11! w-full bg-card', className)}
          aria-label={label}
          aria-invalid={invalid}
        >
          <SelectValue>
            {() =>
              current ? current.label : <span className="text-muted-foreground">{placeholder}</span>
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {clearable && (
            <SelectItem value={NONE}>
              <span className="text-muted-foreground">None</span>
            </SelectItem>
          )}
          {options.length === 0 && !clearable ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">{emptyText}</p>
          ) : (
            options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <span className="flex w-full justify-between gap-3">
                  <span>{option.label}</span>
                  {option.detail && (
                    <span className="text-muted-foreground tabular-nums">{option.detail}</span>
                  )}
                </span>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    )
  }

  return (
    <PickerSheet
      value={value}
      onChange={onChange}
      options={options}
      label={label}
      placeholder={placeholder}
      invalid={invalid}
      id={id}
      clearable={clearable}
      emptyText={emptyText}
      current={current}
      className={className}
    />
  )
}

function PickerSheet({
  value,
  onChange,
  options,
  label,
  placeholder,
  invalid,
  id,
  clearable,
  emptyText,
  current,
  className,
}: {
  value: string
  onChange: (value: string) => void
  options: PickerOption[]
  label: string
  placeholder: string
  invalid: boolean
  id?: string
  clearable: boolean
  emptyText: string
  current: PickerOption | undefined
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const searchId = useId()

  const searchable = options.length > SEARCH_FROM
  const needle = query.trim().toLowerCase()
  const shown = needle
    ? options.filter((option) => option.label.toLowerCase().includes(needle))
    : options

  const pick = (next: string) => {
    onChange(next)
    setOpen(false)
    setQuery('')
  }

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setQuery('')
      }}
      showSwipeHandle
    >
      <DrawerTrigger
        render={
          <button
            type="button"
            id={id}
            aria-label={label}
            aria-invalid={invalid}
            className={cn(
              'flex h-11 w-full items-center justify-between gap-2 rounded-lg border border-input bg-card pr-2.5 pl-3 text-left text-base transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20',
              className,
            )}
          />
        }
      >
        <span className={cn('min-w-0 flex-1 truncate', !current && 'text-muted-foreground')}>
          {current ? current.label : placeholder}
        </span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </DrawerTrigger>

      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{label}</DrawerTitle>
        </DrawerHeader>

        {searchable && (
          <div className="relative px-4 pt-3">
            <Search
              className="pointer-events-none absolute top-1/2 left-7 mt-1.5 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id={searchId}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={`Search ${label.toLowerCase()}`}
              aria-label={`Search ${label.toLowerCase()}`}
              className="h-11 pl-9"
            />
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto px-2 pt-2 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
          <ul className="space-y-0.5">
            {clearable && !needle && (
              <SheetRow selected={value === ''} onPick={() => pick('')}>
                <span className="min-w-0 flex-1 truncate text-muted-foreground">None</span>
              </SheetRow>
            )}
            {shown.map((option) => (
              <SheetRow
                key={option.value}
                selected={option.value === value}
                onPick={() => pick(option.value)}
              >
                <span className="min-w-0 flex-1 truncate">{option.label}</span>
                {option.detail && (
                  <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
                    {option.detail}
                  </span>
                )}
              </SheetRow>
            ))}
          </ul>
          {shown.length === 0 && !(clearable && !needle) && (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              {needle ? `No ${label.toLowerCase()} matches “${query.trim()}”.` : emptyText}
            </p>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}

/** One choice in the sheet: a full-width 48px row, checked when current. */
function SheetRow({
  selected,
  onPick,
  children,
}: {
  selected: boolean
  onPick: () => void
  children: ReactNode
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onPick}
        aria-current={selected ? 'true' : undefined}
        className={cn(
          'flex min-h-12 w-full items-center gap-3 rounded-lg px-3 text-left text-base transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 active:bg-muted',
          selected && 'bg-accent text-accent-foreground hover:bg-accent',
        )}
      >
        {children}
        <Check
          className={cn('size-4 shrink-0 text-primary', !selected && 'invisible')}
          aria-hidden="true"
        />
      </button>
    </li>
  )
}
