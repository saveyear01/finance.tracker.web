import { useState } from 'react'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

const pad = (n: number) => String(n).padStart(2, '0')

/** YYYY-MM-DD → a local Date. `new Date('2026-09-15')` would be UTC midnight,
 * the day before anywhere west of Greenwich. */
function fromIso(iso: string): Date | undefined {
  if (!iso) return undefined
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function toIso(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/**
 * The shadcn Date Picker — a button showing the date that opens a Calendar
 * in a Popover — holding the date as YYYY-MM-DD, the way the API takes it.
 * Picking a day closes it.
 */
export function DatePicker({
  id,
  value,
  onChange,
  placeholder = 'Pick a date',
  label,
  compact = false,
  invalid,
  className,
}: {
  id?: string
  /** YYYY-MM-DD, or '' for none. */
  value: string
  onChange: (value: string) => void
  placeholder?: string
  /** For screen readers when no visible label points at `id`: "Date". */
  label?: string
  /** "Sep 11, 2026" rather than "Fri, Sep 11, 2026" — for a tight row. */
  compact?: boolean
  invalid?: boolean
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const date = fromIso(value)
  const shown = date ? format(date, compact ? 'MMM d, yyyy' : 'EEE, MMM d, yyyy') : placeholder

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            id={id}
            type="button"
            variant="outline"
            aria-invalid={invalid}
            // The label AND the value: an aria-label replaces the visible text.
            aria-label={label ? `${label}: ${shown}` : undefined}
            className={cn(
              'h-11 w-full justify-start px-3 text-base font-normal md:text-sm',
              !date && 'text-muted-foreground',
              className,
            )}
          />
        }
      >
        <CalendarIcon className="text-muted-foreground" />
        {shown}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          defaultMonth={date}
          onSelect={(picked) => {
            if (!picked) return
            onChange(toIso(picked))
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
