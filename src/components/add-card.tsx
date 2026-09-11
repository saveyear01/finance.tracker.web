import { Plus } from 'lucide-react'

import { cn } from '@/lib/utils'

/**
 * "Add another" as the first card of a list — shaped like the rows below it,
 * with a dashed border so it reads as a slot to fill rather than an item.
 * Sits at the top of the list rather than as a button up in the header.
 */
export function AddCard({
  label,
  onClick,
  disabled = false,
  className,
}: {
  label: string
  onClick: () => void
  /** Nothing left to add — the card stays, saying why, but can't be used. */
  disabled?: boolean
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex w-full items-center gap-3 rounded-xl border border-dashed border-border bg-card/50 p-3 text-left font-medium text-muted-foreground transition-colors outline-none hover:border-primary/40 hover:bg-muted/50 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50',
        className,
      )}
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-muted">
        <Plus className="size-4" aria-hidden="true" />
      </span>
      {label}
    </button>
  )
}
