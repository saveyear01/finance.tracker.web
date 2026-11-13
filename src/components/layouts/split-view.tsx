import type { ReactNode } from 'react'

import { useIsCompact } from '@/hooks/use-compact'
import { cn } from '@/lib/utils'

/**
 * List and detail side by side from `lg` (design/large-screen.html rule 2):
 * the list in a 400px column, the open item beside it. Below `lg` only one
 * shows — the detail when there is one, else the list — so a phone keeps its
 * page-per-screen flow and the URLs mean the same thing on both.
 *
 * The routes stay as they are: a detail route renders this with its list
 * and itself; a list route renders it with the list alone (and, on a big
 * screen, usually opens its first item instead).
 */
export function SplitView({
  list,
  detail,
  listWidth = 'default',
  className,
}: {
  list: ReactNode
  /** The open item; null for a list route. */
  detail?: ReactNode
  /** `narrow` (300px) for a settings menu. */
  listWidth?: 'default' | 'narrow'
  className?: string
}) {
  const compact = useIsCompact()

  if (compact) {
    return <div className={cn('mx-auto w-full max-w-xl', className)}>{detail ?? list}</div>
  }

  return (
    <div
      className={cn(
        'mx-auto grid w-full max-w-310 items-start gap-6',
        listWidth === 'narrow'
          ? 'grid-cols-[300px_minmax(0,1fr)]'
          : 'grid-cols-[400px_minmax(0,1fr)]',
        className,
      )}
    >
      {/* The list keeps its place while the detail scrolls — and scrolls on
          its own when it is taller than the window (a long debt list, the
          order editor), or its end would be out of reach. */}
      <div className="sticky top-4 max-h-[calc(100svh-var(--header-height)-2.5rem)] min-w-0 overflow-y-auto overscroll-contain">
        {list}
      </div>
      <div className="min-w-0">{detail}</div>
    </div>
  )
}
