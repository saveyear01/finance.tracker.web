import { cn } from '@/lib/utils'

/**
 * "Add another" as a card of a list — shaped like the rows beside it, with a
 * dashed border so it reads as a slot to fill rather than an item.
 *
 * Deliberately quiet: a centred label, no icon, and a colour well below the
 * rows' own. The list is the point; this is only the way to extend it, and it
 * should be findable without ever competing with the data above it. It comes
 * up to full strength on hover, so it reads as quiet rather than disabled.
 *
 * Lists put it at the top; Debts puts it at the bottom, where the list is the
 * point and adding is the afterthought.
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
        'flex w-full items-center justify-center rounded-xl border border-dashed border-border bg-card/50 p-3 text-center font-medium text-muted-foreground/45 transition-colors outline-none hover:border-primary/40 hover:bg-muted/50 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50',
        className,
      )}
    >
      {label}
    </button>
  )
}
