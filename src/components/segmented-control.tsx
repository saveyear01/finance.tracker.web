import { Radio } from '@base-ui/react/radio'
import { RadioGroup } from '@base-ui/react/radio-group'

import { cn } from '@/lib/utils'

export type SegmentOption<V extends string> = { value: V; label: string }

/**
 * A choice among a few FIXED options, all in view, one tap to change — for
 * what a dropdown would hide behind a second tap (a wallet's type, a debt's
 * rate kind, a bill's recurrence, the Analytics range).
 *
 * A radio group underneath (Base UI): arrow keys move the choice, and a
 * screen reader hears "Bank, radio button, 1 of 3, checked".
 *
 * - `segmented` — equal segments on a muted track, the picked one a raised
 *   card, like the app's tabs. For two to four short labels.
 * - `chips` — a row of pills that scrolls sideways when it runs out of room.
 *   For more options or longer labels.
 */
export function SegmentedControl<V extends string>({
  value,
  onChange,
  options,
  label,
  variant = 'segmented',
  id,
  invalid = false,
  className,
}: {
  value: V
  onChange: (value: V) => void
  options: SegmentOption<V>[]
  /** The group's accessible name — the field it sets. */
  label: string
  variant?: 'segmented' | 'chips'
  id?: string
  invalid?: boolean
  className?: string
}) {
  return (
    <RadioGroup
      id={id}
      value={value}
      onValueChange={(next) => onChange(next as V)}
      aria-label={label}
      aria-invalid={invalid || undefined}
      className={cn(
        variant === 'segmented'
          ? 'flex h-11 w-full gap-1 rounded-xl bg-muted p-1'
          : // Bleeds to the phone's 16px page gutter so the row scrolls edge to
            // edge; on a wide screen there's room, so it just wraps.
            '-mx-4 flex gap-2 overflow-x-auto px-4 py-0.5 lg:mx-0 lg:flex-wrap lg:px-0',
        className,
      )}
    >
      {options.map((option) => (
        <Radio.Root
          key={option.value}
          value={option.value}
          className={cn(
            'inline-flex shrink-0 cursor-pointer items-center justify-center text-sm font-semibold whitespace-nowrap transition-colors outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50',
            variant === 'segmented'
              ? 'flex-1 rounded-lg border border-transparent px-2 text-muted-foreground hover:text-foreground data-checked:border-border data-checked:bg-card data-checked:text-foreground dark:data-checked:border-transparent dark:data-checked:bg-secondary dark:data-checked:text-secondary-foreground'
              : 'h-10 rounded-full border border-border bg-card px-4 text-foreground hover:bg-muted data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground data-checked:hover:bg-primary',
          )}
        >
          {option.label}
        </Radio.Root>
      ))}
    </RadioGroup>
  )
}
