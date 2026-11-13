import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

type EmptyStateProps = {
  icon: LucideIcon
  title: string
  description: string
  /** The button that takes the first step (design/large-screen.html rule A). */
  action?: ReactNode
}

/**
 * Stands in for a page whose data does not exist yet. Deliberately says so,
 * rather than showing invented rows that would read as real.
 */
export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center lg:py-20">
      <div className="mb-4 grid size-12 place-items-center rounded-full bg-accent">
        <Icon className="size-5 text-accent-foreground" />
      </div>
      <p className="font-medium">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {description}
      </p>
      {action && <div className="mt-5 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  )
}
