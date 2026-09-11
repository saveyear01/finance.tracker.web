import { cn } from '@/lib/utils'

/**
 * Where a multi-step form is: one bar per step, filled up to the current
 * one, each labelled. Purely a progress display — the form owns the step
 * and its Back / Next buttons.
 */
export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="flex gap-2" aria-label="Progress">
      {steps.map((label, index) => (
        <li
          key={label}
          aria-current={index === current ? 'step' : undefined}
          className="flex flex-1 flex-col gap-1.5"
        >
          <span
            className={cn(
              'h-1 rounded-full transition-colors',
              index <= current ? 'bg-primary' : 'bg-muted',
            )}
            aria-hidden="true"
          />
          <span
            className={cn(
              'text-xs',
              index === current ? 'font-medium text-foreground' : 'text-muted-foreground',
            )}
          >
            {index + 1}. {label}
          </span>
        </li>
      ))}
    </ol>
  )
}
